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
      console.log("[v0] getExchangeListings - No authenticated user")
      return []
    }

    console.log("[v0] getExchangeListings - Fetching listings for tenant:", tenantId)

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
        custom_location_name,
        category:exchange_categories(id, name, description),
        creator:users!created_by(id, first_name, last_name, profile_picture_url),
        location:locations(id, name)
      `)
      .eq("tenant_id", tenantId)
      .or(`status.eq.published,and(status.eq.draft,created_by.eq.${user.id})`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching exchange listings:", error)
      return []
    }

    console.log("[v0] getExchangeListings - Found listings:", listings?.length || 0)

    const transformedListings = listings?.map((listing: any) => ({
      ...listing,
      price_amount: listing.price,
    }))

    return transformedListings || []
  } catch (error) {
    console.error("[v0] Unexpected error fetching exchange listings:", error)
    return []
  }
}

export async function getExchangeListingById(id: string) {
  // Sprint 4
  return { data: null, error: null }
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
      console.error("[v0] Error fetching exchange categories:", error)
      return []
    }

    return categories || []
  } catch (error) {
    console.error("[v0] Unexpected error fetching exchange categories:", error)
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
    status: "draft" | "published"
    location_type: "community" | "custom" | "none"
    community_location_id: string | null
    custom_location_name: string | null
    custom_location_coordinates: { lat: number; lng: number } | null
    custom_location_type: "marker" | "polygon" | null
    custom_location_path: Array<{ lat: number; lng: number }> | null
    visibility_scope: "community" | "neighborhood"
    neighborhood_ids: string[]
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

    // Verify user is a verified resident
    const { data: resident } = await supabase
      .from("users")
      .select("id, onboarding_completed")
      .eq("id", user.id)
      .single()

    if (!resident || !resident.onboarding_completed) {
      return { success: false, error: "Only verified residents can create listings" }
    }

    // Validate required fields
    if (!data.title.trim()) {
      return { success: false, error: "Listing title is required" }
    }

    if (!data.category_id) {
      return { success: false, error: "Category is required" }
    }

    if (data.pricing_type === "fixed_price" && (!data.price || data.price <= 0)) {
      return { success: false, error: "Price must be greater than 0 for fixed price listings" }
    }

    // Verify category exists
    const { data: category } = await supabase
      .from("exchange_categories")
      .select("id")
      .eq("id", data.category_id)
      .eq("tenant_id", tenantId)
      .single()

    if (!category) {
      return { success: false, error: "Invalid category selected" }
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
    }

    // Only add price if fixed_price type
    if (data.pricing_type === "fixed_price" && data.price) {
      insertData.price = data.price
    }

    // Only add condition if it has a value (Tools & Equipment only)
    if (data.condition) {
      insertData.condition = data.condition
    }

    // Only add quantity if it has a value
    if (data.available_quantity !== null && data.available_quantity !== undefined) {
      insertData.available_quantity = data.available_quantity
    }

    if (data.location_type === "community" && data.community_location_id) {
      insertData.location_id = data.community_location_id
    } else if (data.location_type === "custom") {
      insertData.custom_location_name = data.custom_location_name
      if (data.custom_location_coordinates) {
        insertData.custom_location_lat = data.custom_location_coordinates.lat
        insertData.custom_location_lng = data.custom_location_coordinates.lng
      }
    }

    const { data: listing, error } = await supabase
      .from("exchange_listings")
      .insert(insertData)
      .select('id')
      .single()

    if (error) {
      console.error("[v0] Error creating exchange listing:", error)
      return { success: false, error: error.message }
    }

    if (data.visibility_scope === "neighborhood" && data.neighborhood_ids.length > 0) {
      const neighborhoodInserts = data.neighborhood_ids.map((neighborhoodId) => ({
        tenant_id: tenantId,
        listing_id: listing.id,
        neighborhood_id: neighborhoodId,
      }))

      const { error: neighborhoodError } = await supabase
        .from("exchange_neighborhoods")
        .insert(neighborhoodInserts)

      if (neighborhoodError) {
        console.error("[v0] Error creating neighborhood associations:", neighborhoodError)
        // Don't fail the entire operation if neighborhood insert fails
      }
    }

    console.log("[v0] Exchange listing created successfully:", listing.id)

    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)

    return { success: true, listingId: listing.id }
  } catch (error) {
    console.error("[v0] Unexpected error creating exchange listing:", error)
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
