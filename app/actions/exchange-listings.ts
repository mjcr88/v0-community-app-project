"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ExchangePricingType, ExchangeCondition } from "@/types/exchange"

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
        custom_location_name,
        custom_location_lat,
        custom_location_lng,
        category:exchange_categories(id, name, description),
        creator:users!created_by(id, first_name, last_name, profile_picture_url),
        location:locations(name)
      `)
      .eq("tenant_id", tenantId)
      .or(`status.eq.published,and(status.eq.draft,created_by.eq.${user.id})`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching exchange listings:", error)
      return []
    }

    const transformedListings = listings?.map((listing: any) => ({
      ...listing,
      price_amount: listing.price,
    }))

    return transformedListings || []
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

    const { data: listing, error } = await supabase
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
        created_at,
        published_at,
        photos,
        hero_photo,
        visibility_scope,
        location_id,
        custom_location_name,
        custom_location_lat,
        custom_location_lng,
        category:exchange_categories(id, name, description),
        creator:users!created_by(id, first_name, last_name, profile_picture_url, phone, email),
        location:locations(id, name, type, coordinates, path_coordinates, boundary_coordinates),
        neighborhoods:exchange_neighborhoods(neighborhood:neighborhoods(id, name))
      `)
      .eq("id", listingId)
      .eq("tenant_id", tenantId)
      .single()

    if (error) {
      console.error("Error fetching exchange listing:", error)
      return { success: false, error: error.message, data: null }
    }

    if (!listing) {
      return { success: false, error: "Listing not found", data: null }
    }

    // Check if user has permission to view (status check)
    if (listing.status === "draft" && listing.created_by !== user.id) {
      return { success: false, error: "You don't have permission to view this listing", data: null }
    }

    return { success: true, data: listing }
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
  try {
    const supabase = await createServerClient()

    const { data: categories, error } = await supabase
      .from("exchange_categories")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching exchange categories:", error)
      return []
    }

    return categories || []
  } catch (error) {
    console.error("Unexpected error fetching exchange categories:", error)
    return []
  }
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

    if (!resident || !resident.onboarding_completed) {
      return { success: false, error: "Only verified residents can create listings" }
    }

    if (!data.title.trim()) {
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

    if (data.condition) {
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

    const { data: listings, error } = await supabase
      .from("exchange_listings")
      .select(`
        id,
        title,
        status,
        is_available,
        pricing_type,
        price,
        condition,
        available_quantity,
        photos,
        hero_photo,
        created_at,
        published_at,
        category:exchange_categories(id, name),
        location:locations(name),
        custom_location_name
      `)
      .eq("created_by", userId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user listings:", error)
      return []
    }

    return listings || []
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
      updateData.condition = data.condition
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
