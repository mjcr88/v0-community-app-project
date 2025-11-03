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

  const { data: profile } = await supabase.from("profiles").select("role, tenant_id").eq("id", user.id).single()

  if (!profile || profile.role !== "tenant_admin" || profile.tenant_id !== data.tenant_id) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase.from("locations").insert(data)

  if (error) {
    console.error("Error creating location:", error)
    throw new Error("Failed to create location")
  }

  revalidatePath(`/t/[slug]/admin/map`, "page")
}
