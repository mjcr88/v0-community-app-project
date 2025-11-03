"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createLocation(data: {
  tenant_id: string
  name: string
  type: "facility" | "lot" | "walking_path"
  description?: string | null
  coordinates?: { lat: number; lng: number } | null
  boundary_coordinates?: Array<[number, number]> | null
  path_coordinates?: Array<[number, number]> | null
  facility_type?: string | null
  icon?: string | null
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

  const { error } = await supabase.from("locations").insert(data)

  if (error) {
    console.error("Error creating location:", error)
    throw new Error("Failed to create location")
  }

  revalidatePath(`/t/[slug]/admin/map`, "page")
}
