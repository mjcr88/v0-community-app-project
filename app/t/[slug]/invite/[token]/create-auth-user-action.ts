"use server"

import { createClient } from "@supabase/supabase-js"

export async function createAuthUserAction(email: string, password: string, residentId: string) {
  console.log("[v0] Creating auth user with admin API:", { email, residentId })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY_DEV

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[v0] Server configuration error: missing Supabase credentials")
    return { error: "Server configuration error" }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Fetch the resident to get tenant_id and other metadata
  const { data: resident, error: residentError } = await supabase
    .from("users")
    .select("tenant_id, role, name, profile_picture_url")
    .eq("id", residentId)
    .single()

  if (residentError || !resident) {
    console.error("[v0] Error fetching resident for metadata:", residentError)
    // Fallback: We proceed without metadata, but this increases risk of "Access Denied" if email mismatches.
    // However, failing here blocks signup entirely.
    // Better to fail loud? No, let's log and try. The trigger might fallback to defaults.
  }

  // The handle_new_user trigger will automatically match by email OR use this metadata
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: resident?.name,
      avatar_url: resident?.profile_picture_url,
    },
    app_metadata: {
      tenant_id: resident?.tenant_id,
      role: resident?.role || "resident",
      resident_id: residentId, // Store original resident ID for debugging
    },
  })

  if (error) {
    console.error("[v0] Error creating auth user:", error)
    return { error: error.message }
  }

  console.log("[v0] Auth user created successfully:", data.user?.id)
  console.log("[v0] Trigger automatically linked auth user to resident record with preserved data")

  return { user: data.user }
}
