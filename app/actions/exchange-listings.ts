"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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

    // For now, just fetch all published listings
    // In Sprint 3-11 we'll add filtering, transactions, and visibility logic
    const { data: listings, error } = await supabase
      .from("exchange_listings")
      .select(`
        *,
        category:exchange_categories(id, name, description),
        creator:users!created_by(id, first_name, last_name, profile_picture_url)
      `)
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching exchange listings:", error)
      return []
    }

    console.log("[v0] getExchangeListings - Found listings:", listings?.length || 0)

    return listings || []
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
    status: "draft" | "published"
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

    // Create listing
    const insertData = {
      tenant_id: tenantId,
      created_by: user.id,
      title: data.title.trim(),
      description: data.description,
      category_id: data.category_id,
      status: data.status,
      pricing_type: "free", // Default for Sprint 3A, will be customizable in 3B
      available_quantity: null, // Will be added in Sprint 3B
      visibility_scope: "community", // Default for Sprint 3A, will be customizable in 3C
    }

    const { data: listing, error } = await supabase
      .from("exchange_listings")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating exchange listing:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Exchange listing created successfully:", listing.id)

    revalidatePath(`/t/${tenantSlug}/dashboard/exchange`)

    return { success: true, data: listing }
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
