"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getLocations(tenantId: string) {
  const supabase = await createServerClient()

  const { data: locations, error } = await supabase
    .from("locations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name")

  if (error) {
    console.error("Error fetching locations:", error)
    return []
  }

  return locations || []
}

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
      .maybeSingle()

    if (existingLocation) {
      const { data: updatedLocation, error } = await supabase
        .from("locations")
        .update(data)
        .eq("id", existingLocation.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating location:", error)
        throw new Error("Failed to update location")
      }

      revalidatePath("/", "layout")
      return updatedLocation
    }
  }

  if (data.neighborhood_id && data.type === "neighborhood") {
    const { data: existingLocation } = await supabase
      .from("locations")
      .select("id")
      .eq("neighborhood_id", data.neighborhood_id)
      .eq("type", "neighborhood")
      .maybeSingle()

    if (existingLocation) {
      const { data: updatedLocation, error } = await supabase
        .from("locations")
        .update(data)
        .eq("id", existingLocation.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating location:", error)
        throw new Error("Failed to update location")
      }

      revalidatePath("/", "layout")
      return updatedLocation
    }
  }

  const { data: newLocation, error } = await supabase.from("locations").insert(data).select().single()

  if (error) {
    console.error("Error creating location:", error)
    throw new Error("Failed to create location")
  }

  // Link the location back to the lot or neighborhood
  if (newLocation && data.lot_id) {
    await supabase.from("lots").update({ location_id: newLocation.id }).eq("id", data.lot_id)
  }

  if (newLocation && data.neighborhood_id && data.type === "neighborhood") {
    await supabase.from("neighborhoods").update({ location_id: newLocation.id }).eq("id", data.neighborhood_id)
  }

  revalidatePath("/", "layout")
  return newLocation
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

  const { data: location } = await supabase.from("locations").select("type").eq("id", locationId).single()

  if (location?.type === "boundary") {
    await supabase.from("tenants").update({ map_boundary_coordinates: null }).eq("id", tenantId)
  }

  await supabase.from("lots").update({ location_id: null }).eq("location_id", locationId)
  await supabase.from("neighborhoods").update({ location_id: null }).eq("location_id", locationId)

  const { error: deleteError } = await supabase
    .from("locations")
    .delete()
    .eq("id", locationId)
    .eq("tenant_id", tenantId)

  if (deleteError) {
    console.error("Error deleting location:", deleteError)
    throw new Error("Failed to delete location")
  }

  revalidatePath("/", "layout")
}
