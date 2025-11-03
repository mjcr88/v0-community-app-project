"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createLocation(data: {
  tenant_id: string
  name: string
  type: "facility" | "lot" | "walking_path" | "neighborhood"
  description?: string | null
  coordinates?: { lat: number; lng: number } | null
  boundary_coordinates?: Array<[number, number]> | null
  path_coordinates?: Array<[number, number]> | null
  facility_type?: string | null
  icon?: string | null
  lot_id?: string | null
  neighborhood_id?: string | null
  photos?: string[] | null
}) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role, tenant_id, is_tenant_admin")
    .eq("id", user.id)
    .single()

  if (
    !userData ||
    (!userData.is_tenant_admin && userData.role !== "super_admin" && userData.role !== "tenant_admin") ||
    (userData.tenant_id !== data.tenant_id && userData.role !== "super_admin")
  ) {
    throw new Error("Unauthorized")
  }

  if (data.lot_id) {
    const { data: existingLocation } = await supabase
      .from("locations")
      .select("id")
      .eq("lot_id", data.lot_id)
      .eq("type", "lot")
      .single()

    if (existingLocation) {
      const { error } = await supabase.from("locations").update(data).eq("id", existingLocation.id)

      if (error) {
        console.error("Error updating location:", error)
        throw new Error("Failed to update location")
      }

      revalidatePath(`/t/[slug]/admin/map`, "page")
      return
    }
  }

  if (data.neighborhood_id && data.type === "neighborhood") {
    const { data: existingLocation } = await supabase
      .from("locations")
      .select("id")
      .eq("neighborhood_id", data.neighborhood_id)
      .eq("type", "neighborhood")
      .single()

    if (existingLocation) {
      const { error } = await supabase.from("locations").update(data).eq("id", existingLocation.id)

      if (error) {
        console.error("Error updating location:", error)
        throw new Error("Failed to update location")
      }

      revalidatePath(`/t/[slug]/admin/map`, "page")
      return
    }
  }

  // Insert new location
  const { error } = await supabase.from("locations").insert(data)

  if (error) {
    console.error("Error creating location:", error)
    throw new Error("Failed to create location")
  }

  revalidatePath(`/t/[slug]/admin/map`, "page")
}

export async function updateLocation(
  locationId: string,
  data: {
    tenant_id: string
    name: string
    type: "facility" | "lot" | "walking_path" | "neighborhood"
    description?: string | null
    coordinates?: { lat: number; lng: number } | null
    boundary_coordinates?: Array<[number, number]> | null
    path_coordinates?: Array<[number, number]> | null
    facility_type?: string | null
    icon?: string | null
    lot_id?: string | null
    neighborhood_id?: string | null
    photos?: string[] | null
  },
) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role, tenant_id, is_tenant_admin")
    .eq("id", user.id)
    .single()

  if (
    !userData ||
    (!userData.is_tenant_admin && userData.role !== "super_admin" && userData.role !== "tenant_admin") ||
    (userData.tenant_id !== data.tenant_id && userData.role !== "super_admin")
  ) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase.from("locations").update(data).eq("id", locationId)

  if (error) {
    console.error("Error updating location:", error)
    throw new Error("Failed to update location")
  }

  revalidatePath(`/t/[slug]/admin/map`, "page")
}

export async function deleteLocation(locationId: string, tenantId: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role, tenant_id, is_tenant_admin")
    .eq("id", user.id)
    .single()

  if (
    !userData ||
    (!userData.is_tenant_admin && userData.role !== "super_admin" && userData.role !== "tenant_admin") ||
    (userData.tenant_id !== tenantId && userData.role !== "super_admin")
  ) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase.from("locations").delete().eq("id", locationId)

  if (error) {
    console.error("Error deleting location:", error)
    throw new Error("Failed to delete location")
  }

  revalidatePath(`/t/[slug]/admin/map`, "page")
}
