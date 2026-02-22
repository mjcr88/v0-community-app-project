"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ExchangePricingType, ExchangeCondition } from "@/types/exchange"
import { createNotification } from "@/app/actions/notifications"

/**
 * Server actions for exchange listing operations
 */

import { getExchangeListings as getExchangeListingsFromLib, getExchangeListingById as getExchangeListingByIdFromLib, getExchangeCategories as getExchangeCategoriesFromLib } from "@/lib/data/exchange"

// ... (keep imports)

// ... (keep createNotification)

/**
 * Server actions for exchange listing operations
 */

export async function getExchangeListings(tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const listings = await getExchangeListingsFromLib(tenantId, {
      includeDraftsByCreator: user.id,
      enrichWithCategory: true,
      enrichWithCreator: true,
      enrichWithLocation: true,
      enrichWithFlagCount: true,
      excludeArchived: true,
    })

    return listings
  } catch (error) {
    console.error("Unexpected error fetching exchange listings:", error)
    return []
  }
}

export async function getExchangeListingById(listingId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated", data: null }
    }

    const listing = await getExchangeListingByIdFromLib(listingId, {
      enrichWithCategory: true,
      enrichWithCreator: true,
      enrichWithLocation: true,
      enrichWithNeighborhoods: true,
      excludeArchived: false,
    })

    if (!listing || listing.tenant_id !== tenantId) {
      return { success: false, error: "Listing not found", data: null }
    }

    // Check if user has permission to view (status check)
    if (listing.status === "draft" && listing.created_by !== user.id) {
      return { success: false, error: "You don't have permission to view this listing", data: null }
    }

    // Check for active transactions
    const { count: activeTransactionsCount, error: txError } = await supabase
      .from("exchange_transactions")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listingId)
      .in("status", ["pending", "confirmed", "picked_up"])

    const hasActiveTransactions = activeTransactionsCount ? activeTransactionsCount > 0 : false
    const enrichedListing = {
      ...listing,
      has_active_transactions: hasActiveTransactions
    }

    return { success: true, data: enrichedListing }
  } catch (error) {
    console.error("Unexpected error fetching exchange listing:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
      data: null,
    }
  }
}

export async function getExchangeCategories(tenantId: string) {
  return getExchangeCategoriesFromLib(tenantId)
}

export async function createExchangeListing(
  tenantSlug: string,
  tenantId: string,
  data: {
    title: string
    description: string | null
    category_id: string
    pricing_type: ExchangePricingType
    price: number | null
    condition: ExchangeCondition | null
    available_quantity: number | null
    visibility_scope: "community" | "neighborhood"
    neighborhood_ids: string[]
    location_id?: string | null
    custom_location_name?: string | null
    custom_location_lat?: number | null
    custom_location_lng?: number | null
    status: "draft" | "published"
    photos?: string[]
    hero_photo?: string | null
  },
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { data: resident } = await supabase
      .from("users")
      .select("id, onboarding_completed")
      .eq("id", user.id)
      .single()

    // Runtime validation of Enums
    const validPricingTypes = ['free', 'fixed_price', 'pay_what_you_want']
    const validConditions = ['new', 'slightly_used', 'used', 'slightly_damaged', 'maintenance']

    if (!validPricingTypes.includes(data.pricing_type)) {
      return { success: false, error: `Invalid pricing type: ${data.pricing_type}` }
    }

    if (data.condition && data.condition.trim() !== '' && !validConditions.includes(data.condition)) {
      return { success: false, error: `Invalid condition: ${data.condition}` }
    }



    if (!data.title || !data.title.trim()) {
      return { success: false, error: "Listing title is required" }
    }

    if (!data.category_id) {
      return { success: false, error: "Category is required" }
    }

    if (data.pricing_type === "fixed_price" && (!data.price || data.price <= 0)) {
      return { success: false, error: "Price must be greater than 0 for fixed price listings" }
    }

    if (data.visibility_scope === "neighborhood" && data.neighborhood_ids.length === 0) {
      return { success: false, error: "At least one neighborhood must be selected for neighborhood-only visibility" }
    }

    const insertData: any = {
      tenant_id: tenantId,
      created_by: user.id,
      title: data.title.trim(),
      description: data.description,
      category_id: data.category_id,
      status: data.status,
      pricing_type: data.pricing_type,
      visibility_scope: data.visibility_scope,
      photos: data.photos || [],
      hero_photo: data.hero_photo || null,
    }

    if (data.pricing_type === "fixed_price" && data.price) {
      insertData.price = data.price
    }

    // Only include condition if it has a valid value (not null, undefined, or empty string)
    if (data.condition && typeof data.condition === 'string' && data.condition.trim() !== '') {
      insertData.condition = data.condition
    }

    if (data.available_quantity !== null && data.available_quantity !== undefined) {
      insertData.available_quantity = data.available_quantity
    }

    if (data.location_id) {
      insertData.location_id = data.location_id
    }

    if (data.custom_location_name) {
      insertData.custom_location_name = data.custom_location_name
    }

    if (data.custom_location_lat !== null && data.custom_location_lat !== undefined) {
      insertData.custom_location_lat = data.custom_location_lat
    }

    if (data.custom_location_lng !== null && data.custom_location_lng !== undefined) {
      insertData.custom_location_lng = data.custom_location_lng
    }

    const { data: listing, error } = await supabase
      .from("exchange_listings")
      .insert(insertData)
      .select("id")
      .single()

    if (error) {
      console.error("Error creating exchange listing:", error)
      return { success: false, error: error.message }
    }

    if (data.visibility_scope === "neighborhood" && data.neighborhood_ids.length > 0) {
      const neighborhoodInserts = data.neighborhood_ids.map(neighborhoodId => ({
        tenant_id: tenantId,
        listing_id: listing.id,
        neighborhood_id: neighborhoodId,
      }))

      const { error: neighborhoodError } = await supabase
        .from("exchange_neighborhoods")
        .insert(neighborhoodInserts)

      if (neighborhoodError) {
        console.error("Error creating neighborhood associations:", neighborhoodError)
      }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)

    return { success: true, listingId: listing.id }
  } catch (error) {
    console.error("Unexpected error creating exchange listing:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}


export async function getUserListings(userId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return []
    }

    const listings = await getExchangeListingsFromLib(tenantId, {
      creatorId: userId,
      enrichWithCategory: true,
      enrichWithLocation: true,
      excludeArchived: true,
    })

    return listings
  } catch (error) {
    console.error("Unexpected error fetching user listings:", error)
    return []
  }
}

export async function updateExchangeListing(
  listingId: string,
  tenantSlug: string,
  tenantId: string,
  data: {
    title?: string
    description?: string | null
    category_id?: string
    pricing_type?: ExchangePricingType
    price?: number | null
    condition?: ExchangeCondition | null
    available_quantity?: number | null
    visibility_scope?: "community" | "neighborhood"
    neighborhood_ids?: string[]
    location_id?: string | null
    custom_location_name?: string | null
    custom_location_lat?: number | null
    custom_location_lng?: number | null
    photos?: string[]
    hero_photo?: string | null
  },
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get listing to verify ownership
    const { data: listing, error: listingError } = await supabase
      .from("exchange_listings")
      .select("id, created_by, tenant_id, status")
      .eq("id", listingId)
      .eq("tenant_id", tenantId)
      .single()

    if (listingError || !listing) {
      return { success: false, error: "Listing not found" }
    }

    // Only creator can edit
    if (listing.created_by !== user.id) {
      return { success: false, error: "You don't have permission to edit this listing" }
    }

    // Check for active transactions
    const { data: activeTransactions } = await supabase
      .from("exchange_transactions")
      .select("id")
      .eq("listing_id", listingId)
      .in("status", ["pending", "confirmed", "picked_up"])
      .limit(1)

    const hasActiveTransactions = activeTransactions && activeTransactions.length > 0

    // If active transactions exist, only allow quantity updates
    if (hasActiveTransactions) {
      if (data.available_quantity !== undefined) {
        const { error } = await supabase
          .from("exchange_listings")
          .update({ available_quantity: data.available_quantity })
          .eq("id", listingId)

        if (error) {
          console.error("Error updating listing quantity:", error)
          return { success: false, error: error.message }
        }

        revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)
        return { success: true }
      } else {
        return {
          success: false,
          error: "Cannot edit listing details with active transactions. Only quantity can be updated.",
        }
      }
    }

    // Runtime validation of Enums
    const validPricingTypes = ['free', 'fixed_price', 'pay_what_you_want']
    const validConditions = ['new', 'slightly_used', 'used', 'slightly_damaged', 'maintenance']

    if (data.pricing_type !== undefined && !validPricingTypes.includes(data.pricing_type)) {
      return { success: false, error: `Invalid pricing type: ${data.pricing_type}` }
    }

    if (data.condition !== undefined && data.condition !== null && data.condition.trim() !== '' && !validConditions.includes(data.condition)) {
      return { success: false, error: `Invalid condition: ${data.condition}` }
    }

    // Prepare update data
    const updateData: any = {}

    if (data.title !== undefined) {
      if (!data.title.trim()) {
        return { success: false, error: "Listing title is required" }
      }
      updateData.title = data.title.trim()
    }

    if (data.description !== undefined) {
      updateData.description = data.description
    }

    if (data.category_id !== undefined) {
      if (!data.category_id) {
        return { success: false, error: "Category is required" }
      }
      updateData.category_id = data.category_id
    }

    if (data.pricing_type !== undefined) {
      updateData.pricing_type = data.pricing_type

      if (data.pricing_type === "fixed_price") {
        if (data.price === undefined || data.price === null || data.price <= 0) {
          return { success: false, error: "Price must be greater than 0 for fixed price listings" }
        }
        updateData.price = data.price
      } else {
        updateData.price = null
      }
    }

    if (data.price !== undefined && data.pricing_type !== "fixed_price") {
      updateData.price = data.price
    }

    if (data.condition !== undefined) {
      if (data.condition === null || data.condition.trim() === '') {
        updateData.condition = null
      } else {
        updateData.condition = data.condition
      }
    }

    if (data.available_quantity !== undefined) {
      updateData.available_quantity = data.available_quantity
    }

    if (data.visibility_scope !== undefined) {
      if (data.visibility_scope === "neighborhood" && (!data.neighborhood_ids || data.neighborhood_ids.length === 0)) {
        return { success: false, error: "At least one neighborhood must be selected for neighborhood-only visibility" }
      }
      updateData.visibility_scope = data.visibility_scope
    }

    if (data.location_id !== undefined) {
      updateData.location_id = data.location_id
    }

    if (data.custom_location_name !== undefined) {
      updateData.custom_location_name = data.custom_location_name
    }

    if (data.custom_location_lat !== undefined) {
      updateData.custom_location_lat = data.custom_location_lat
    }

    if (data.custom_location_lng !== undefined) {
      updateData.custom_location_lng = data.custom_location_lng
    }

    if (data.photos !== undefined) {
      updateData.photos = data.photos
    }

    if (data.hero_photo !== undefined) {
      updateData.hero_photo = data.hero_photo
    }

    updateData.updated_at = new Date().toISOString()

    // Update listing
    const { error } = await supabase.from("exchange_listings").update(updateData).eq("id", listingId)

    if (error) {
      console.error("Error updating exchange listing:", error)
      return { success: false, error: error.message }
    }

    // Handle neighborhood visibility updates
    if (data.visibility_scope !== undefined || data.neighborhood_ids !== undefined) {
      // Delete existing neighborhood associations
      await supabase.from("exchange_neighborhoods").delete().eq("listing_id", listingId)

      // Add new associations if neighborhood visibility
      if (
        (data.visibility_scope === "neighborhood" || listing.status === "neighborhood") &&
        data.neighborhood_ids &&
        data.neighborhood_ids.length > 0
      ) {
        const neighborhoodInserts = data.neighborhood_ids.map((neighborhoodId) => ({
          tenant_id: tenantId,
          listing_id: listingId,
          neighborhood_id: neighborhoodId,
        }))

        await supabase.from("exchange_neighborhoods").insert(neighborhoodInserts)
      }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)
    return { success: true }
  } catch (error) {
    console.error("Unexpected error updating exchange listing:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function pauseExchangeListing(listingId: string, tenantSlug: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get listing to verify ownership and current state
    const { data: listing, error: listingError } = await supabase
      .from("exchange_listings")
      .select("id, created_by, is_available")
      .eq("id", listingId)
      .eq("tenant_id", tenantId)
      .single()

    if (listingError || !listing) {
      return { success: false, error: "Listing not found" }
    }

    // Only creator can pause/resume
    if (listing.created_by !== user.id) {
      return { success: false, error: "You don't have permission to modify this listing" }
    }

    // Toggle is_available
    const { error } = await supabase
      .from("exchange_listings")
      .update({
        is_available: !listing.is_available,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId)

    if (error) {
      console.error("Error toggling listing availability:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)
    revalidatePath(`/t/${tenantSlug}/dashboard`)
    return { success: true, is_available: !listing.is_available }
  } catch (error) {
    console.error("Unexpected error toggling listing availability:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function publishDraftListing(listingId: string, tenantSlug: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get listing to verify ownership and status
    const { data: listing, error: listingError } = await supabase
      .from("exchange_listings")
      .select("*")
      .eq("id", listingId)
      .eq("tenant_id", tenantId)
      .single()

    if (listingError || !listing) {
      return { success: false, error: "Listing not found" }
    }

    // Only creator can publish
    if (listing.created_by !== user.id) {
      return { success: false, error: "You don't have permission to publish this listing" }
    }

    // Only drafts can be published
    if (listing.status !== "draft") {
      return { success: false, error: "Only draft listings can be published" }
    }

    // Validate required fields
    if (!listing.title || !listing.title.trim()) {
      return { success: false, error: "Title is required before publishing" }
    }

    if (!listing.category_id) {
      return { success: false, error: "Category is required before publishing" }
    }

    if (listing.pricing_type === "fixed_price" && (!listing.price || listing.price <= 0)) {
      return { success: false, error: "Price must be set for fixed price listings" }
    }

    // Publish listing
    const { error } = await supabase
      .from("exchange_listings")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId)

    if (error) {
      console.error("Error publishing listing:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)
    revalidatePath(`/t/${tenantSlug}/dashboard`)
    return { success: true }
  } catch (error) {
    console.error("Unexpected error publishing listing:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function deleteExchangeListing(listingId: string, tenantSlug: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get listing to verify ownership
    const { data: listing, error: listingError } = await supabase
      .from("exchange_listings")
      .select("id, created_by, tenant_id")
      .eq("id", listingId)
      .eq("tenant_id", tenantId)
      .single()

    if (listingError || !listing) {
      return { success: false, error: "Listing not found" }
    }

    // Check if user is creator or tenant admin
    const { data: userData } = await supabase
      .from("users")
      .select("is_tenant_admin")
      .eq("id", user.id)
      .single()

    const isCreator = listing.created_by === user.id
    const isAdmin = userData?.is_tenant_admin === true

    if (!isCreator && !isAdmin) {
      return { success: false, error: "You don't have permission to delete this listing" }
    }

    // CRITICAL: Check for active transactions
    const { data: activeTransactions } = await supabase
      .from("exchange_transactions")
      .select("id, status")
      .eq("listing_id", listingId)
      .in("status", ["pending", "confirmed", "picked_up"])

    if (activeTransactions && activeTransactions.length > 0) {
      return {
        success: false,
        error: "Cannot delete listing with active transactions. Please wait for all transactions to complete.",
      }
    }

    // Delete neighborhood associations (explicit, even though cascade should handle it)
    await supabase.from("exchange_neighborhoods").delete().eq("listing_id", listingId)

    // Delete listing
    const { error: deleteError } = await supabase.from("exchange_listings").delete().eq("id", listingId)

    if (deleteError) {
      console.error("Error deleting exchange listing:", deleteError)
      return { success: false, error: deleteError.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)
    revalidatePath(`/t/${tenantSlug}/dashboard`)
    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting exchange listing:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function createBorrowRequest(
  listingId: string,
  tenantSlug: string,
  tenantId: string,
  data: {
    quantity: number
    proposed_pickup_date: string
    proposed_return_date: string | null // Make optional for categories that don't need return dates
    borrower_message?: string
  },
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from("exchange_listings")
      .select("id, created_by, title, available_quantity, is_available, status")
      .eq("id", listingId)
      .eq("tenant_id", tenantId)
      .single()

    if (listingError || !listing) {
      return { success: false, error: "Listing not found" }
    }

    // Validation
    if (listing.created_by === user.id) {
      return { success: false, error: "You cannot borrow your own listing" }
    }

    if (!listing.is_available || listing.status !== "published") {
      return { success: false, error: "This listing is not available for borrowing" }
    }

    if (data.quantity > listing.available_quantity) {
      return { success: false, error: `Only ${listing.available_quantity} available` }
    }

    if (data.quantity < 1) {
      return { success: false, error: "Quantity must be at least 1" }
    }

    if (data.proposed_return_date) {
      const pickupDate = new Date(data.proposed_pickup_date)
      const returnDate = new Date(data.proposed_return_date)

      if (returnDate <= pickupDate) {
        return { success: false, error: "Return date must be after pickup date" }
      }
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from("exchange_transactions")
      .select("id")
      .eq("listing_id", listingId)
      .eq("borrower_id", user.id)
      .eq("status", "requested")
      .limit(1)

    if (existingRequest && existingRequest.length > 0) {
      return { success: false, error: "You already have a pending request for this listing" }
    }

    const transactionData: any = {
      tenant_id: tenantId,
      listing_id: listingId,
      borrower_id: user.id,
      lender_id: listing.created_by,
      quantity: data.quantity,
      status: "requested",
      proposed_pickup_date: data.proposed_pickup_date,
      borrower_message: data.borrower_message || null,
    }

    // Only add return date if provided
    if (data.proposed_return_date) {
      transactionData.proposed_return_date = data.proposed_return_date
    }

    const { data: transaction, error: transactionError } = await supabase
      .from("exchange_transactions")
      .insert(transactionData)
      .select("id")
      .single()

    if (transactionError || !transaction) {
      console.error("Error creating transaction:", transactionError)
      return { success: false, error: "Failed to create borrow request" }
    }

    console.log("[v0] Creating notification for lender:", {
      tenantId,
      recipientId: listing.created_by,
      borrowerId: user.id,
      listingTitle: listing.title,
      transactionId: transaction.id,
    })

    const notificationResult = await createNotification({
      tenant_id: tenantId,
      recipient_id: listing.created_by,
      type: "exchange_request",
      title: `New borrow request for ${listing.title}`,
      message: data.borrower_message || `Someone wants to borrow ${data.quantity} of your ${listing.title}`,
      action_required: true,
      actor_id: user.id,
      exchange_transaction_id: transaction.id,
      exchange_listing_id: listingId,
    })

    console.log("[v0] Notification creation result:", notificationResult)

    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)
    revalidatePath(`/t/${tenantSlug}/dashboard/notifications`)

    return { success: true, transactionId: transaction.id }
  } catch (error) {
    console.error("Unexpected error creating borrow request:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function confirmBorrowRequest(
  transactionId: string,
  tenantSlug: string,
  tenantId: string,
  lenderMessage?: string,
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get transaction details
    const { data: transaction, error: transactionError } = await supabase
      .from("exchange_transactions")
      .select(`
        id,
        lender_id,
        borrower_id,
        listing_id,
        quantity,
        status,
        proposed_return_date,
        listing:exchange_listings(id, title, created_by, available_quantity)
      `)
      .eq("id", transactionId)
      .eq("tenant_id", tenantId)
      .single()

    if (transactionError || !transaction) {
      return { success: false, error: "Transaction not found" }
    }

    // Only lender can confirm
    if (transaction.lender_id !== user.id) {
      return { success: false, error: "You don't have permission to confirm this request" }
    }

    if (transaction.status !== "requested") {
      return { success: false, error: "This request has already been processed" }
    }

    // Check if listing still has enough quantity
    const listing = transaction.listing as any
    if (transaction.quantity > listing.available_quantity) {
      return { success: false, error: "Not enough quantity available" }
    }

    // Update transaction to confirmed
    const updateData: any = {
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      expected_return_date: transaction.proposed_return_date,
      lender_message: lenderMessage || null,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from("exchange_transactions")
      .update(updateData)
      .eq("id", transactionId)

    if (updateError) {
      console.error("Error updating transaction:", updateError)
      return { success: false, error: "Failed to confirm request" }
    }

    // Decrement available quantity
    const newQuantity = listing.available_quantity - transaction.quantity
    const updateListingData: any = {
      available_quantity: newQuantity,
      updated_at: new Date().toISOString(),
    }

    // Auto-disable if quantity reaches 0
    if (newQuantity <= 0) {
      updateListingData.is_available = false
    }

    await supabase
      .from("exchange_listings")
      .update(updateListingData)
      .eq("id", transaction.listing_id)

    await supabase
      .from("notifications")
      .update({
        action_taken: true,
        action_response: 'confirmed'
      })
      .eq("exchange_transaction_id", transactionId)
      .eq("type", "exchange_request")

    await createNotification({
      tenant_id: tenantId,
      recipient_id: transaction.borrower_id,
      type: "exchange_confirmed",
      title: `Your request for ${listing.title} was approved`,
      message: "You can now coordinate pickup with the lender.",
      action_required: false,
      actor_id: user.id,
      exchange_transaction_id: transactionId,
      exchange_listing_id: transaction.listing_id,
    })

    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)
    revalidatePath(`/t/${tenantSlug}/dashboard/notifications`)

    return { success: true }
  } catch (error) {
    console.error("Unexpected error confirming request:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function rejectBorrowRequest(
  transactionId: string,
  tenantSlug: string,
  tenantId: string,
  lenderMessage?: string,
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get transaction details
    const { data: transaction, error: transactionError } = await supabase
      .from("exchange_transactions")
      .select(`
        id,
        lender_id,
        borrower_id,
        listing_id,
        status,
        listing:exchange_listings(id, title)
      `)
      .eq("id", transactionId)
      .eq("tenant_id", tenantId)
      .single()

    if (transactionError || !transaction) {
      return { success: false, error: "Transaction not found" }
    }

    // Only lender can reject
    if (transaction.lender_id !== user.id) {
      return { success: false, error: "You don't have permission to reject this request" }
    }

    if (transaction.status !== "requested") {
      return { success: false, error: "This request has already been processed" }
    }

    const { error: updateError } = await supabase
      .from("exchange_transactions")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
        lender_message: lenderMessage || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)

    if (updateError) {
      console.error("Error updating transaction:", updateError)
      return { success: false, error: "Failed to reject request" }
    }

    await supabase
      .from("notifications")
      .update({
        action_taken: true,
        action_response: 'rejected'
      })
      .eq("exchange_transaction_id", transactionId)
      .eq("type", "exchange_request")

    const listing = transaction.listing as any
    await createNotification({
      tenant_id: tenantId,
      recipient_id: transaction.borrower_id,
      type: "exchange_rejected",
      title: `Your request for ${listing.title} was declined`,
      message: "The lender is unable to accommodate your request at this time.",
      action_required: false,
      actor_id: user.id,
      exchange_transaction_id: transactionId,
      exchange_listing_id: transaction.listing_id,
    })

    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)
    revalidatePath(`/t/${tenantSlug}/dashboard/notifications`)

    return { success: true }
  } catch (error) {
    console.error("Unexpected error rejecting request:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getUserPendingRequest(userId: string, listingId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const { data: transaction, error } = await supabase
      .from("exchange_transactions")
      .select("id, status, quantity, proposed_pickup_date, proposed_return_date, borrower_message")
      .eq("borrower_id", userId)
      .eq("listing_id", listingId)
      .eq("tenant_id", tenantId)
      .eq("status", "requested")
      .maybeSingle()

    if (error) {
      console.error("Error fetching pending request:", error)
      return null
    }

    return transaction || null
  } catch (error) {
    console.error("Unexpected error fetching pending request:", error)
    return null
  }
}

export async function getExchangeListingsByLocation(locationId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const { data: listings, error } = await supabase
      .from("exchange_listings")
      .select(`
        id,
        title,
        description,
        status,
        is_available,
        pricing_type,
        price,
        condition,
        available_quantity,
        created_by,
        photos,
        hero_photo,
        category:exchange_categories(id, name, description),
        creator:users!created_by(id, first_name, last_name, profile_picture_url)
      `)
      .eq("tenant_id", tenantId)
      .eq("location_id", locationId)
      .eq("status", "published")
      .eq("is_available", true)
      .is("archived_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching exchange listings by location:", error)
      return []
    }

    const transformedListings = listings?.map((listing: any) => ({
      ...listing,
      price_amount: listing.price,
    }))

    return transformedListings || []
  } catch (error) {
    console.error("Unexpected error fetching exchange listings by location:", error)
    return []
  }
}

export async function getExchangeListingsByUser(userId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const { data: listings, error } = await supabase
      .from("exchange_listings")
      .select(`
        id,
        title,
        description,
        status,
        is_available,
        pricing_type,
        price,
        condition,
        available_quantity,
        created_by,
        photos,
        hero_photo,
        location_id,
        custom_location_name,
        category:exchange_categories(id, name, description),
        location:locations(name),
        creator:users!created_by(id, first_name, last_name, profile_picture_url)
      `)
      .eq("tenant_id", tenantId)
      .eq("created_by", userId)
      .eq("status", "published")
      .eq("is_available", true)
      .is("archived_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching exchange listings by user:", error)
      return []
    }

    const transformedListings = listings?.map((listing: any) => ({
      ...listing,
      price_amount: listing.price,
    }))

    return transformedListings || []
  } catch (error) {
    console.error("Unexpected error fetching exchange listings by user:", error)
    return []
  }
}

export async function flagExchangeListing(listingId: string, reason: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Validate reason
    const trimmedReason = reason.trim()
    if (trimmedReason.length < 10 || trimmedReason.length > 500) {
      return { success: false, error: "Reason must be between 10 and 500 characters" }
    }

    // Get tenant_id from slug
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .single()

    if (tenantError || !tenant) {
      return { success: false, error: "Tenant not found" }
    }

    // Verify listing exists and belongs to tenant
    const { data: listing, error: listingError } = await supabase
      .from("exchange_listings")
      .select("id, tenant_id")
      .eq("id", listingId)
      .eq("tenant_id", tenant.id)
      .single()

    if (listingError || !listing) {
      return { success: false, error: "Listing not found" }
    }

    // Check if user already flagged
    const { data: alreadyFlagged, error: rpcError } = await supabase.rpc("has_user_flagged_exchange_listing", {
      p_listing_id: listingId,
      p_user_id: user.id,
      p_tenant_id: tenant.id,
    })

    console.log("[v0] Flag check RPC result:", { alreadyFlagged, rpcError })

    if (rpcError) {
      console.error("[v0] RPC error checking if already flagged:", rpcError)
      // Don't fail - continue with insert attempt (unique constraint will catch duplicates)
    }

    if (alreadyFlagged === true) {
      console.log("[v0] User already flagged this listing")
      return { success: false, error: "You have already flagged this listing" }
    }

    // Insert flag
    console.log("[v0] Attempting to insert flag:", {
      listing_id: listingId,
      flagged_by: user.id,
      tenant_id: tenant.id,
      reason_length: trimmedReason.length,
    })

    const { data: insertData, error: insertError } = await supabase.from("exchange_flags").insert({
      listing_id: listingId,
      flagged_by: user.id,
      tenant_id: tenant.id,
      reason: trimmedReason,
    }).select()

    console.log("[v0] Insert result:", { insertData, insertError })

    if (insertError) {
      console.error("[v0] Insert error details:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      })

      // Handle duplicate key constraint violation
      if (insertError.code === "23505") {
        return { success: false, error: "You have already flagged this listing" }
      }

      // Check for RLS policy violation
      if (insertError.code === "42501" || insertError.message?.includes("policy")) {
        console.error("[v0] RLS POLICY VIOLATION - User cannot insert into exchange_flags")
        return { success: false, error: "Permission denied. Please contact support." }
      }

      return { success: false, error: insertError.message }
    }

    console.log("[v0] Flag successfully inserted!")

    // Update listing to mark as flagged
    const { error: updateError } = await supabase
      .from("exchange_listings")
      .update({
        is_flagged: true,
        flagged_at: new Date().toISOString(),
      })
      .eq("id", listingId)

    if (updateError) {
      console.error("[v0] Error updating listing:", updateError)
    }

    // Get updated flag count
    const { data: updatedCount } = await supabase.rpc("get_exchange_listing_flag_count", {
      p_listing_id: listingId,
      p_tenant_id: tenant.id,
    })

    console.log("[v0] Updated flag count:", updatedCount)

    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)

    return { success: true, flagCount: updatedCount ?? 1 }
  } catch (error) {
    console.error("[v0] Unexpected error flagging listing:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getExchangeListingFlagCount(
  listingId: string,
  userId: string,
  tenantId: string
) {
  const supabase = await createServerClient()

  // Get flag count
  const { data: count } = await supabase.rpc("get_exchange_listing_flag_count", {
    p_listing_id: listingId,
    p_tenant_id: tenantId,
  })

  // Check if user has flagged
  const { data: flagged } = await supabase.rpc("has_user_flagged_exchange_listing", {
    p_listing_id: listingId,
    p_user_id: userId,
    p_tenant_id: tenantId,
  })

  return {
    success: true,
    flagCount: count ?? 0,
    hasUserFlagged: flagged ?? false,
  }
}

export async function adminDeleteListings(listingIds: string[], tenantId: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { data: userData } = await supabase.from("users").select("is_tenant_admin, role").eq("id", user.id).single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "super_admin" || userData?.role === "tenant_admin"

    if (!isAdmin) {
      return { success: false, error: "You don't have permission to delete listings" }
    }

    const { error } = await supabase.from("exchange_listings").delete().in("id", listingIds).eq("tenant_id", tenantId)

    if (error) {
      console.error("[v0] Error deleting listings:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/admin/exchange`)
    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)
    revalidatePath(`/t/${tenantSlug}/dashboard`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error deleting listings:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function adminArchiveListings(
  listingIds: string[],
  tenantId: string,
  tenantSlug: string,
  reason?: string,
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { data: userData } = await supabase.from("users").select("is_tenant_admin, role").eq("id", user.id).single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "super_admin" || userData?.role === "tenant_admin"

    if (!isAdmin) {
      return { success: false, error: "You don't have permission to archive listings" }
    }

    const { data: listings } = await supabase
      .from("exchange_listings")
      .select("id, created_by, title")
      .in("id", listingIds)
      .eq("tenant_id", tenantId)

    const { error } = await supabase
      .from("exchange_listings")
      .update({
        archived_at: new Date().toISOString(),
        archived_by: user.id,
        is_available: false,
        updated_at: new Date().toISOString(),
      })
      .in("id", listingIds)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("[v0] Error archiving listings:", error)
      return { success: false, error: error.message }
    }

    const { data: pendingTransactions } = await supabase
      .from("exchange_transactions")
      .select("id, borrower_id, listing_id")
      .in("listing_id", listingIds)
      .eq("status", "pending") // Changed from 'requested' to 'pending'

    if (listings && listings.length > 0) {
      // Notify creators
      for (const listing of listings) {
        if (listing.created_by) {
          await createNotification({
            tenant_id: tenantId,
            recipient_id: listing.created_by,
            type: "exchange_listing_archived",
            title: "Listing Archived by Admin",
            message: `Your listing "${listing.title}" has been archived by an admin and is no longer visible to residents.${reason ? `\n\nReason: ${reason}` : ""}`,
            action_required: false,
            exchange_listing_id: listing.id,
          })
        }
      }

      // Notify users with pending requests
      if (pendingTransactions && pendingTransactions.length > 0) {
        const listingMap = new Map(listings.map(l => [l.id, l]))

        for (const transaction of pendingTransactions) {
          const listing = listingMap.get(transaction.listing_id)
          if (listing && transaction.borrower_id) {
            await createNotification({
              tenant_id: tenantId,
              recipient_id: transaction.borrower_id,
              type: "exchange_request_cancelled",
              title: "Listing Request Cancelled",
              message: `The listing "${listing.title}" you requested has been archived by an admin. Your request has been cancelled.${reason ? `\n\nReason: ${reason}` : ""}`,
              action_required: false,
              exchange_listing_id: listing.id,
              exchange_transaction_id: transaction.id,
            })
          }
        }

        // Update transactions to cancelled
        await supabase
          .from("exchange_transactions")
          .update({ status: "cancelled" })
          .in("id", pendingTransactions.map(t => t.id))
      }
    }

    revalidatePath(`/t/${tenantSlug}/admin/exchange`)
    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error archiving listings:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function adminUnflagListing(
  listingId: string,
  tenantId: string,
  tenantSlug: string,
  reason?: string,
) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Verify user is tenant admin
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("is_tenant_admin, role")
    .eq("id", user.id)
    .single()

  if (userError || !userData) {
    return { success: false, error: "Failed to verify admin status" }
  }

  const isAdmin =
    userData.is_tenant_admin === true || userData.role === "super_admin" || userData.role === "tenant_admin"

  if (!isAdmin) {
    return { success: false, error: "Only admins can clear flags" }
  }

  // Get listing details for the creator
  const { data: listing, error: listingError } = await supabase
    .from("exchange_listings")
    .select("title, created_by")
    .eq("id", listingId)
    .eq("tenant_id", tenantId)
    .single()

  if (listingError || !listing) {
    return { success: false, error: "Listing not found" }
  }

  // Delete all flags for this listing
  const { error: deleteFlagsError } = await supabase
    .from("exchange_flags")
    .delete()
    .eq("listing_id", listingId)
    .eq("tenant_id", tenantId)

  if (deleteFlagsError) {
    console.error("[v0] Error deleting flags:", deleteFlagsError)
    return { success: false, error: "Failed to clear flags" }
  }

  // Notify the creator that flags were cleared (if reason provided)
  if (reason && listing.created_by) {
    await createNotification({
      tenant_id: tenantId,
      recipient_id: listing.created_by,
      type: "exchange_listing_unflagged",
      title: "Listing Flags Cleared",
      message: `Your listing "${listing.title}" has been reviewed and cleared by an administrator. Admin note: ${reason}`,
      action_required: false,
      exchange_listing_id: listingId,
    })
  }

  revalidatePath(`/t/${tenantSlug}/admin/exchange`)
  revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)

  return { success: true }
}


export async function dismissListingFlag(flagId: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { data: userData } = await supabase.from("users").select("is_tenant_admin, role").eq("id", user.id).single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "super_admin" || userData?.role === "tenant_admin"

    if (!isAdmin) {
      return { success: false, error: "You don't have permission to dismiss flags" }
    }

    const { data: flag, error: flagError } = await supabase
      .from("exchange_flags")
      .select("id, listing_id")
      .eq("id", flagId)
      .single()

    if (flagError || !flag) {
      return { success: false, error: "Flag not found" }
    }

    const { error: deleteError } = await supabase.from("exchange_flags").delete().eq("id", flagId)

    if (deleteError) {
      console.error("[v0] Error dismissing flag:", deleteError)
      return { success: false, error: deleteError.message }
    }

    // Check if there are any remaining flags
    const { data: remainingFlags } = await supabase
      .from("exchange_flags")
      .select("id")
      .eq("listing_id", flag.listing_id)

    if (remainingFlags && remainingFlags.length === 0) {
      // No more flags, update listing
      await supabase
        .from("exchange_listings")
        .update({
          is_flagged: false,
          flagged_at: null,
        })
        .eq("id", flag.listing_id)
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)
    revalidatePath(`/t/${tenantSlug}/admin/exchange`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error dismissing flag:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getListingFlagDetails(listingId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { data: userData } = await supabase.from("users").select("is_tenant_admin, role").eq("id", user.id).single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "super_admin" || userData?.role === "tenant_admin"

    if (!isAdmin) {
      return { success: false, error: "You don't have permission to view flag details" }
    }

    const { data: flags, error } = await supabase
      .from("exchange_flags")
      .select(
        `
        id,
        reason,
        created_at,
        flagged_by,
        user:users!flagged_by(
          id,
          first_name,
          last_name,
          profile_picture_url
        )
      `,
      )
      .eq("listing_id", listingId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching flag details:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: flags || [] }
  } catch (error) {
    console.error("[v0] Unexpected error fetching flag details:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}
