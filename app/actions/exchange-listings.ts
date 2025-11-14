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

export async function updateExchangeListing() {
  // Sprint 4-5
  return { data: null, error: null }
}

export async function deleteExchangeListing() {
  // Sprint 5
  return { data: null, error: null }
}
