"use server"

import { createServerClient } from "@/lib/supabase/server"

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

export async function createExchangeListing() {
  // Sprint 3
  return { data: null, error: null }
}

export async function updateExchangeListing() {
  // Sprint 4-5
  return { data: null, error: null }
}

export async function deleteExchangeListing() {
  // Sprint 5
  return { data: null, error: null }
}
