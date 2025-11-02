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

  // This links the auth user to the existing resident record with lot_id and family_unit_id
  const { error: updateError } = await supabase
    .from("users")
    .update({
      id: data.user!.id, // Update the ID to match the auth user ID
    })
    .eq("id", residentId)

  if (updateError) {
    console.error("[v0] Error updating resident record:", updateError)
    // Try alternative approach: delete old record and create new one with auth user ID
    console.log("[v0] Attempting alternative approach: recreate record with auth user ID")

    // Delete the old placeholder record
    await supabase.from("users").delete().eq("id", residentId)

    // Create new record with auth user ID
    const { error: insertError } = await supabase.from("users").insert({
      id: data.user!.id,
      email: email,
      tenant_id: existingResident.tenant_id,
      role: existingResident.role,
      lot_id: existingResident.lot_id,
      family_unit_id: existingResident.family_unit_id,
    })

    if (insertError) {
      console.error("[v0] Error creating new user record:", insertError)
      return { error: "Failed to link auth user to resident record" }
    }

    console.log("[v0] Successfully recreated user record with auth user ID")
  } else {
    console.log("[v0] Successfully updated resident record with auth user ID")
  }

  return { user: data.user }
}
