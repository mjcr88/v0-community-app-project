"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Archive a listing (creator only, no active transactions)
 */
export async function archiveListing(
  listingId: string,
  userId: string,
  tenantId: string,
  tenantSlug: string
) {
  const supabase = await createClient()

  // Verify user is the creator
  const { data: listing, error: fetchError } = await supabase
    .from("exchange_listings")
    .select("created_by")
    .eq("id", listingId)
    .eq("tenant_id", tenantId)
    .single()

  if (fetchError || !listing) {
    return { success: false, error: "Listing not found" }
  }

  if (listing.created_by !== userId) {
    return { success: false, error: "Only the creator can archive this listing" }
  }

  // Check for active transactions
  const { data: activeTransactions } = await supabase
    .from("exchange_transactions")
    .select("id")
    .eq("listing_id", listingId)
    .in("status", ["requested", "confirmed", "picked_up"])
    .limit(1)

  if (activeTransactions && activeTransactions.length > 0) {
    return { 
      success: false, 
      error: "Cannot archive listing with active transactions. Please wait for all transactions to complete." 
    }
  }

  // Archive the listing
  const { error: updateError } = await supabase
    .from("exchange_listings")
    .update({
      archived_at: new Date().toISOString(),
      archived_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)

  if (updateError) {
    if (updateError.message?.includes("column") && updateError.message?.includes("archived_at")) {
      console.error("[v0] archived_at column does not exist. Run migration: scripts/exchange/10_add_archived_fields.sql")
      return { 
        success: false, 
        error: "Archive feature not set up. Please run the database migration script first." 
      }
    }
    console.error("[v0] Error archiving listing:", updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath(`/t/${tenantSlug}/dashboard`)
  
  return { success: true }
}

/**
 * Unarchive/restore a listing
 */
export async function unarchiveListing(
  listingId: string,
  userId: string,
  tenantId: string,
  tenantSlug: string
) {
  const supabase = await createClient()

  // Verify user is the creator
  const { data: listing, error: fetchError } = await supabase
    .from("exchange_listings")
    .select("created_by, available_quantity")
    .eq("id", listingId)
    .eq("tenant_id", tenantId)
    .single()

  if (fetchError || !listing) {
    return { success: false, error: "Listing not found" }
  }

  if (listing.created_by !== userId) {
    return { success: false, error: "Only the creator can restore this listing" }
  }

  // Restore to active status if quantity available
  const shouldBeAvailable = listing.available_quantity > 0

  const { error: updateError } = await supabase
    .from("exchange_listings")
    .update({
      archived_at: null,
      archived_by: null,
      status: "published",
      is_available: shouldBeAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)

  if (updateError) {
    console.error("[v0] Error restoring listing:", updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath(`/t/${tenantSlug}/dashboard`)
  
  return { 
    success: true, 
    warning: !shouldBeAvailable ? "Listing restored but marked unavailable due to zero quantity" : undefined
  }
}

/**
 * Get archived listings with transaction counts
 */
export async function getArchivedListings(
  userId: string,
  tenantId: string,
  offset: number = 0,
  limit: number = 10
) {
  const supabase = await createClient()

  // Get archived listings for this user
  const { data: listings, error } = await supabase
    .from("exchange_listings")
    .select(`
      *,
      exchange_categories!inner (
        id,
        name
      )
    `)
    .eq("tenant_id", tenantId)
    .eq("created_by", userId)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false })
    .range(offset, offset + limit)

  if (error) {
    console.error("[v0] Error fetching archived listings:", error)
    return { listings: [], total: 0, hasMore: false }
  }

  // Get transaction counts for each listing
  const listingIds = listings.map(l => l.id)
  
  const { data: transactionCounts } = await supabase
    .from("exchange_transactions")
    .select("listing_id")
    .in("listing_id", listingIds)
    .eq("status", "completed")

  // Count transactions per listing
  const counts: Record<string, number> = {}
  transactionCounts?.forEach(t => {
    counts[t.listing_id] = (counts[t.listing_id] || 0) + 1
  })

  // Add counts to listings
  const listingsWithCounts = listings.map(listing => ({
    ...listing,
    transaction_count: counts[listing.id] || 0
  }))

  // Get total count
  const { count } = await supabase
    .from("exchange_listings")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("created_by", userId)
    .not("archived_at", "is", null)

  return {
    listings: listingsWithCounts,
    total: count || 0,
    hasMore: (offset + limit) < (count || 0)
  }
}

/**
 * Get transaction history for a specific listing
 */
export async function getListingHistory(
  listingId: string,
  userId: string,
  tenantId: string,
  offset: number = 0,
  limit: number = 10
) {
  const supabase = await createClient()

  // Verify user is the creator
  const { data: listing, error: listingError } = await supabase
    .from("exchange_listings")
    .select("created_by, title")
    .eq("id", listingId)
    .eq("tenant_id", tenantId)
    .single()

  if (listingError || !listing) {
    return { transactions: [], listing: null, total: 0, hasMore: false, error: "Listing not found" }
  }

  if (listing.created_by !== userId) {
    return { transactions: [], listing: null, total: 0, hasMore: false, error: "Unauthorized" }
  }

  // Get completed transactions
  const { data: transactions, error } = await supabase
    .from("exchange_transactions")
    .select(`
      *,
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
    .eq("listing_id", listingId)
    .eq("tenant_id", tenantId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .range(offset, offset + limit)

  if (error) {
    console.error("[v0] Error fetching listing history:", error)
    return { transactions: [], listing: null, total: 0, hasMore: false, error: error.message }
  }

  // Get total count
  const { count } = await supabase
    .from("exchange_transactions")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .eq("tenant_id", tenantId)
    .eq("status", "completed")

  // Transform transactions
  const transactionsWithNames = transactions.map(t => ({
    ...t,
    borrower_name: t.borrower ? `${t.borrower.first_name} ${t.borrower.last_name}` : "Unknown",
    borrower_avatar_url: t.borrower?.profile_picture_url || null,
    lender_name: t.lender ? `${t.lender.first_name} ${t.lender.last_name}` : "Unknown",
    lender_avatar_url: t.lender?.profile_picture_url || null,
  }))

  return {
    transactions: transactionsWithNames,
    listing: listing,
    total: count || 0,
    hasMore: (offset + limit) < (count || 0)
  }
}

/**
 * Get user's completed transactions (both borrowed and lent)
 */
export async function getCompletedTransactions(
  userId: string,
  tenantId: string,
  offset: number = 0,
  limit: number = 10
) {
  const supabase = await createClient()

  const { data: transactions, error } = await supabase
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
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .range(offset, offset + limit)

  if (error) {
    console.error("[v0] Error fetching completed transactions:", error)
    return { transactions: [], total: 0, hasMore: false }
  }

  // Get total count
  const { count } = await supabase
    .from("exchange_transactions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .or(`borrower_id.eq.${userId},lender_id.eq.${userId}`)
    .eq("status", "completed")

  return {
    transactions: transactions || [],
    total: count || 0,
    hasMore: (offset + limit) < (count || 0)
  }
}
