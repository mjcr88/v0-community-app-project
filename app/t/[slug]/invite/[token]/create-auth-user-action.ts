"use server"

import { createClient } from "@supabase/supabase-js"

export async function createAuthUserAction(email: string, password: string, residentId: string) {
  console.log("[v0] Creating auth user with admin API:", { email, residentId })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: existingResident, error: fetchError } = await supabase
    .from("users")
    .select("lot_id, family_unit_id, tenant_id, role")
    .eq("id", residentId)
    .single()

  if (fetchError || !existingResident) {
    console.error("[v0] Error fetching existing resident:", fetchError)
    return { error: "Resident record not found" }
  }

  console.log("[v0] Existing resident data:", existingResident)

  // Use admin API to create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
  })

  if (error) {
    console.error("[v0] Error creating auth user:", error)
    return { error: error.message }
  }

  console.log("[v0] Auth user created successfully:", data.user?.id)

  console.log("[v0] Deleting old placeholder record and creating new one with auth user ID")

  // Delete the old placeholder record
  const { error: deleteError } = await supabase.from("users").delete().eq("id", residentId)

  if (deleteError) {
    console.error("[v0] Error deleting old record:", deleteError)
    return { error: "Failed to delete old resident record" }
  }

  // Create new record with auth user ID and ALL preserved fields
  const { error: insertError } = await supabase.from("users").insert({
    id: data.user!.id,
    email: email,
    tenant_id: existingResident.tenant_id,
    role: existingResident.role,
    lot_id: existingResident.lot_id,
    family_unit_id: existingResident.family_unit_id, // Now preserving family_unit_id
  })

  if (insertError) {
    console.error("[v0] Error creating new user record:", insertError)
    return { error: "Failed to link auth user to resident record" }
  }

  console.log("[v0] Successfully created user record with auth user ID and preserved lot_id and family_unit_id")

  return { user: data.user }
}
