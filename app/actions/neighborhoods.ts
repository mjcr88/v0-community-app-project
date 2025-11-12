"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function getNeighborhoods(tenantId: string) {
  try {
    const supabase = await createServerClient()

    const { data: neighborhoods, error } = await supabase
      .from("neighborhoods")
      .select("id, name, description")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching neighborhoods:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: neighborhoods || [] }
  } catch (error) {
    console.error("[v0] Unexpected error fetching neighborhoods:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
      data: [],
    }
  }
}

export async function getResidents(tenantId: string) {
  try {
    const supabase = await createServerClient()

    const { data: residents, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, profile_picture_url, family_unit_id")
      .eq("tenant_id", tenantId)
      .eq("role", "resident")
      .order("first_name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching residents:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: residents || [] }
  } catch (error) {
    console.error("[v0] Unexpected error fetching residents:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
      data: [],
    }
  }
}

export async function getFamilyUnits(tenantId: string) {
  try {
    const supabase = await createServerClient()

    const { data: families, error } = await supabase
      .from("family_units")
      .select("id, name, profile_picture_url")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching family units:", error)
      return { success: false, error: error.message, data: [] }
    }

    const familyIds = families?.map((f) => f.id) || []
    const { data: memberCounts } = await supabase.from("users").select("family_unit_id").in("family_unit_id", familyIds)

    const countMap = new Map<string, number>()
    memberCounts?.forEach((m) => {
      const current = countMap.get(m.family_unit_id) || 0
      countMap.set(m.family_unit_id, current + 1)
    })

    const familiesWithCounts = families?.map((f) => ({
      ...f,
      member_count: countMap.get(f.id) || 0,
    }))

    return { success: true, data: familiesWithCounts || [] }
  } catch (error) {
    console.error("[v0] Unexpected error fetching family units:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
      data: [],
    }
  }
}
