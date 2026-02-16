"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"
import { format } from "date-fns"

type TransactionWithDetails = {
  id: string
  tenant_id: string
  listing_id: string
  borrower_id: string
  lender_id: string
  quantity: number
  status: string
  proposed_pickup_date: string | null
  proposed_return_date: string | null
  confirmed_pickup_date: string | null
  expected_return_date: string | null
  actual_pickup_date: string | null
  actual_return_date: string | null
  borrower_message: string | null
  lender_message: string | null
  rejection_reason: string | null
  return_condition: string | null
  return_notes: string | null
  return_damage_photo_url: string | null
  created_at: string
  updated_at: string
  confirmed_at: string | null
  rejected_at: string | null
  completed_at: string | null
  exchange_listings: {
    id: string
    title: string
    hero_photo: string | null
    category_id: string
    exchange_categories: {
      id: string
      name: string
    } | null
  } | null
  borrower: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  } | null
  lender: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  } | null
}

/**
 * Get all transactions for a user (as borrower or lender)
 */
export async function getMyTransactions(userId: string, tenantId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("exchange_transactions")
    .select(`
      *,
      exchange_listings!inner (
        id,
        title,
        hero_photo,
        category_id,
        exchange_categories (
          id,
          name
        )
      ),
      borrower:users!exchange_transactions_borrower_id_fkey (
        id,
        first_name,
        last_name,
        profile_picture_url
      ),
      lender:users!exchange_transactions_lender_id_fkey (
        id,
        first_name,
        last_name,
        profile_picture_url
      )
    `)
    .eq("tenant_id", tenantId)
    .or(`borrower_id.eq.${userId},lender_id.eq.${userId}`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching transactions:", error)
    return []
  }

  return (data as unknown as TransactionWithDetails[]) || []
}

/**
 * Get a single transaction by ID with full details
 */
export async function getTransactionById(
  transactionId: string,
  userId: string,
  tenantId: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("exchange_transactions")
    .select(`
      *,
      exchange_listings!inner (
        id,
        title,
        description,
        hero_photo,
        category_id,
        exchange_categories (
          id,
          name
        )
      ),
      borrower:users!exchange_transactions_borrower_id_fkey (
        id,
        first_name,
        last_name,
        profile_picture_url,
        email
      ),
      lender:users!exchange_transactions_lender_id_fkey (
        id,
        first_name,
        last_name,
        profile_picture_url,
        email
      )
    `)
    .eq("id", transactionId)
    .eq("tenant_id", tenantId)
    .single()

  if (error) {
    console.error("[v0] Error fetching transaction:", error)
    return { success: false, error: error.message }
  }

  // Verify user is borrower or lender
  if (data.borrower_id !== userId && data.lender_id !== userId) {
    return { success: false, error: "Unauthorized" }
  }

  return { success: true, data: data as unknown as TransactionWithDetails }
}

/**
 * Mark item as picked up (both parties can do this)
 */
export async function markItemPickedUp(
  transactionId: string,
  userId: string,
  tenantId: string,
  tenantSlug: string
) {
  const supabase = await createClient()

  const { data: transaction, error: fetchError } = await supabase
    .from("exchange_transactions")
    .select(`
      *,
      exchange_listings!inner (
        id,
        title,
        category_id,
        exchange_categories (
          id,
          name
        )
      ),
      borrower:users!exchange_transactions_borrower_id_fkey (
        id,
        first_name,
        last_name
      ),
      lender:users!exchange_transactions_lender_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq("id", transactionId)
    .eq("tenant_id", tenantId)
    .single()

  if (fetchError || !transaction) {
    console.error("[v0] Error fetching transaction:", fetchError)
    return { success: false, error: "Transaction not found" }
  }

  if (transaction.borrower_id !== userId && transaction.lender_id !== userId) {
    return { success: false, error: "Unauthorized" }
  }

  // Validate status is confirmed
  if (transaction.status !== "confirmed") {
    return { success: false, error: "Transaction must be confirmed before pickup" }
  }

  const categoryName = transaction.exchange_listings?.exchange_categories?.name || ""
  const requiresReturn = !["Services & Skills", "Food & Produce"].includes(categoryName)

  if (!requiresReturn) {
    // Update transaction to completed and restore quantity
    const { error: updateError } = await supabase
      .from("exchange_transactions")
      .update({
        status: "completed",
        actual_pickup_date: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)

    if (updateError) {
      console.error("[v0] Error updating transaction:", updateError)
      return { success: false, error: updateError.message }
    }

    // Restore listing quantity ONLY if it's NOT "Food & Produce"
    // "Services & Skills" still restores (reusable capacity)
    // "Food & Produce" consumes (one-way)
    if (categoryName !== "Food & Produce") {
      const { data: listing } = await supabase
        .from("exchange_listings")
        .select("available_quantity")
        .eq("id", transaction.listing_id)
        .single()

      if (listing) {
        await supabase
          .from("exchange_listings")
          .update({
            available_quantity: listing.available_quantity + transaction.quantity,
            is_available: true,
          })
          .eq("id", transaction.listing_id)
      }
    }

    // Create completion notification for both parties
    const otherPartyId = transaction.borrower_id === userId
      ? transaction.lender_id
      : transaction.borrower_id
    const actorName = transaction.borrower_id === userId
      ? `${transaction.borrower?.first_name} ${transaction.borrower?.last_name}`
      : `${transaction.lender?.first_name} ${transaction.lender?.last_name}`

    await createNotification({
      tenant_id: tenantId,
      recipient_id: otherPartyId,
      type: "exchange_picked_up",
      title: `Service/Appointment completed`,
      message: `${actorName} confirmed completion of ${transaction.exchange_listings?.title}`,
      actor_id: userId,
      exchange_transaction_id: transactionId,
      exchange_listing_id: transaction.listing_id,
    })
  } else {
    const { error: updateError } = await supabase
      .from("exchange_transactions")
      .update({
        status: "picked_up",
        actual_pickup_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)

    if (updateError) {
      console.error("[v0] Error updating transaction:", updateError)
      return { success: false, error: updateError.message }
    }

    // Create notification for other party
    const otherPartyId = transaction.borrower_id === userId
      ? transaction.lender_id
      : transaction.borrower_id
    const actorName = transaction.borrower_id === userId
      ? `${transaction.borrower?.first_name} ${transaction.borrower?.last_name}`
      : `${transaction.lender?.first_name} ${transaction.lender?.last_name}`

    await createNotification({
      tenant_id: tenantId,
      recipient_id: otherPartyId,
      type: "exchange_picked_up",
      title: "Item picked up",
      message: `${actorName} confirmed pickup of ${transaction.exchange_listings?.title}`,
      actor_id: userId,
      exchange_transaction_id: transactionId,
      exchange_listing_id: transaction.listing_id,
    })

    // If the actor is the lender, also create a confirmation notification for them
    // This ensures they have a fresh notification at the top to eventually "Mark Returned"
    if (userId === transaction.lender_id) {
      await createNotification({
        tenant_id: tenantId,
        recipient_id: userId,
        type: "exchange_picked_up",
        title: "Pickup confirmed",
        message: `You marked ${transaction.exchange_listings?.title} as picked up.`,
        actor_id: userId,
        exchange_transaction_id: transactionId,
        exchange_listing_id: transaction.listing_id,
      })
    }

    if (transaction.expected_return_date) {
      const returnDate = new Date(transaction.expected_return_date)
      const now = new Date()
      const twoDaysFromNow = new Date(now)
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)

      // If return date is within 2 days, check if reminder was already sent
      if (returnDate <= twoDaysFromNow && returnDate > now) {
        // Check if reminder notification already exists for this transaction
        const { data: existingReminder } = await supabase
          .from("notifications")
          .select("id")
          .eq("exchange_transaction_id", transactionId)
          .eq("type", "exchange_reminder")
          .eq("recipient_id", transaction.borrower_id)
          .maybeSingle()

        if (!existingReminder) {
          await createNotification({
            tenant_id: tenantId,
            recipient_id: transaction.borrower_id,
            type: "exchange_reminder",
            title: `Reminder: Return ${transaction.exchange_listings?.title} soon`,
            message: `Please return ${transaction.exchange_listings?.title} by ${format(returnDate, "MMM d, yyyy")}`,
            actor_id: userId,
            exchange_transaction_id: transactionId,
            exchange_listing_id: transaction.listing_id,
            action_url: `/t/${tenantSlug}/dashboard?tab=transactions`,
          })
        }
      }
    }
  }

  revalidatePath(`/t/${tenantSlug}/dashboard`)
  revalidatePath(`/t/${tenantSlug}/dashboard/notifications`)

  return { success: true }
}

/**
 * Mark item as returned (LENDER ONLY)
 * Auto-complete transaction and restore quantity when marked as returned
 */
export async function markItemReturned(
  transactionId: string,
  lenderId: string,
  tenantId: string,
  tenantSlug: string,
  returnData: {
    return_condition: "good" | "minor_wear" | "damaged" | "broken"
    return_notes?: string
    return_damage_photo_url?: string
  }
) {
  const supabase = await createClient()

  const { data: transaction, error: fetchError } = await supabase
    .from("exchange_transactions")
    .select(`
      *,
      exchange_listings!inner (
        id,
        title,
        available_quantity
      ),
      borrower:users!exchange_transactions_borrower_id_fkey (
        id,
        first_name,
        last_name
      ),
      lender:users!exchange_transactions_lender_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq("id", transactionId)
    .eq("tenant_id", tenantId)
    .single()

  if (fetchError || !transaction) {
    console.error("[v0] Error fetching transaction:", fetchError)
    return { success: false, error: "Transaction not found" }
  }

  if (transaction.lender_id !== lenderId) {
    return { success: false, error: "Only the lender can mark items as returned" }
  }

  // Validate status is picked_up
  if (transaction.status !== "picked_up") {
    return { success: false, error: "Transaction must be picked up before return" }
  }

  // Validate return condition is provided
  if (!returnData.return_condition) {
    return { success: false, error: "Return condition is required" }
  }

  // Update to completed status and restore quantity immediately
  const { error: updateError } = await supabase
    .from("exchange_transactions")
    .update({
      status: "completed",
      actual_return_date: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      return_condition: returnData.return_condition,
      return_notes: returnData.return_notes || null,
      return_damage_photo_url: returnData.return_damage_photo_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)

  if (updateError) {
    console.error("[v0] Error updating transaction:", updateError)
    return { success: false, error: updateError.message }
  }

  // Restore listing quantity immediately
  const { data: listing } = await supabase
    .from("exchange_listings")
    .select("available_quantity")
    .eq("id", transaction.listing_id)
    .single()

  if (listing) {
    await supabase
      .from("exchange_listings")
      .update({
        available_quantity: listing.available_quantity + transaction.quantity,
        is_available: true,
      })
      .eq("id", transaction.listing_id)
  }

  // Update notification to reflect completion
  await createNotification({
    tenant_id: tenantId,
    recipient_id: transaction.borrower_id,
    type: "exchange_completed",
    title: "Transaction completed",
    message: `${transaction.lender?.first_name} ${transaction.lender?.last_name} has confirmed the return of ${transaction.exchange_listings?.title}. Condition: ${returnData.return_condition}. Thank you!`,
    actor_id: lenderId,
    exchange_transaction_id: transactionId,
    exchange_listing_id: transaction.listing_id,
  })

  revalidatePath(`/t/${tenantSlug}/dashboard`)
  revalidatePath(`/t/${tenantSlug}/dashboard/notifications`)
  revalidatePath(`/t/${tenantSlug}/exchange`)

  return { success: true }
}

/**
 * Mark transaction as completed (LENDER ONLY)
 */
export async function markTransactionCompleted(
  transactionId: string,
  lenderId: string,
  tenantId: string,
  tenantSlug: string
) {
  const supabase = await createClient()

  const { data: transaction, error: fetchError } = await supabase
    .from("exchange_transactions")
    .select(`
      *,
      exchange_listings!inner (
        id,
        title,
        available_quantity
      ),
      borrower:users!exchange_transactions_borrower_id_fkey (
        id,
        first_name,
        last_name
      ),
      lender:users!exchange_transactions_lender_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq("id", transactionId)
    .eq("tenant_id", tenantId)
    .single()

  if (fetchError || !transaction) {
    console.error("[v0] Error fetching transaction:", fetchError)
    return { success: false, error: "Transaction not found" }
  }

  if (transaction.lender_id !== lenderId) {
    return { success: false, error: "Only the lender can mark transactions as complete" }
  }

  if (transaction.status !== "returned") {
    return { success: false, error: "Transaction must be returned before completion" }
  }

  const { error: updateError } = await supabase
    .from("exchange_transactions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)

  if (updateError) {
    console.error("[v0] Error updating transaction:", updateError)
    return { success: false, error: updateError.message }
  }

  const { data: listing } = await supabase
    .from("exchange_listings")
    .select("available_quantity")
    .eq("id", transaction.listing_id)
    .single()

  if (listing) {
    await supabase
      .from("exchange_listings")
      .update({
        available_quantity: listing.available_quantity + transaction.quantity,
        is_available: true,
      })
      .eq("id", transaction.listing_id)
  }

  await createNotification({
    tenant_id: tenantId,
    recipient_id: transaction.borrower_id,
    type: "exchange_completed",
    title: "Transaction completed",
    message: `${transaction.lender?.first_name} ${transaction.lender?.last_name} has marked your transaction for ${transaction.exchange_listings?.title} as complete. Thank you!`,
    actor_id: lenderId,
    exchange_transaction_id: transactionId,
    exchange_listing_id: transaction.listing_id,
  })

  revalidatePath(`/t/${tenantSlug}/dashboard`)
  revalidatePath(`/t/${tenantSlug}/dashboard/notifications`)
  revalidatePath(`/t/${tenantSlug}/exchange`)

  return { success: true }
}

/**
 * Cancel transaction (both parties can do this, but only before pickup)
 */
export async function cancelTransaction(
  transactionId: string,
  userId: string,
  tenantId: string,
  tenantSlug: string,
  cancelReason?: string
) {
  const supabase = await createClient()

  const { data: transaction, error: fetchError } = await supabase
    .from("exchange_transactions")
    .select(`
      *,
      exchange_listings!inner (
        id,
        title,
        available_quantity
      ),
      borrower:users!exchange_transactions_borrower_id_fkey (
        id,
        first_name,
        last_name
      ),
      lender:users!exchange_transactions_lender_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq("id", transactionId)
    .eq("tenant_id", tenantId)
    .single()

  if (fetchError || !transaction) {
    console.error("[v0] Error fetching transaction:", fetchError)
    return { success: false, error: "Transaction not found" }
  }

  if (transaction.borrower_id !== userId && transaction.lender_id !== userId) {
    return { success: false, error: "Unauthorized" }
  }

  if (transaction.status !== "confirmed") {
    return { success: false, error: "Can only cancel before pickup" }
  }

  const { error: updateError } = await supabase
    .from("exchange_transactions")
    .update({
      status: "rejected",
      rejection_reason: cancelReason || "Cancelled by user",
      rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)

  if (updateError) {
    console.error("[v0] Error updating transaction:", updateError)
    return { success: false, error: updateError.message }
  }

  const { data: listing } = await supabase
    .from("exchange_listings")
    .select("available_quantity")
    .eq("id", transaction.listing_id)
    .single()

  if (listing) {
    await supabase
      .from("exchange_listings")
      .update({
        available_quantity: listing.available_quantity + transaction.quantity,
        is_available: true,
      })
      .eq("id", transaction.listing_id)
  }

  const otherPartyId = transaction.borrower_id === userId
    ? transaction.lender_id
    : transaction.borrower_id
  const actorName = transaction.borrower_id === userId
    ? `${transaction.borrower?.first_name} ${transaction.borrower?.last_name}`
    : `${transaction.lender?.first_name} ${transaction.lender?.last_name}`

  await createNotification({
    tenant_id: tenantId,
    recipient_id: otherPartyId,
    type: "exchange_cancelled",
    title: "Request cancelled",
    message: `${actorName} has cancelled the request for ${transaction.exchange_listings?.title}`,
    actor_id: userId,
    exchange_transaction_id: transactionId,
    exchange_listing_id: transaction.listing_id,
  })

  revalidatePath(`/t/${tenantSlug}/dashboard`)
  revalidatePath(`/t/${tenantSlug}/dashboard/notifications`)
  revalidatePath(`/t/${tenantSlug}/exchange`)

  return { success: true }
}

/**
 * Get pending request for a user on a specific listing
 */
export async function getUserPendingRequest(userId: string, listingId: string, tenantId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("exchange_transactions")
    .select("id, quantity, proposed_pickup_date, proposed_return_date")
    .eq("borrower_id", userId)
    .eq("listing_id", listingId)
    .eq("tenant_id", tenantId)
    .eq("status", "requested")
    .maybeSingle()

  if (error) {
    console.error("[v0] Error fetching pending request:", error)
    return null
  }

  return data
}
