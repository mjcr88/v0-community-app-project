"use server"

import { createClient } from "@supabase/supabase-js"

export async function createAuthUserAction(email: string, password: string, userId: string) {
  console.log("[v0] Creating auth user with admin API:", { email, userId })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // The handle_new_user trigger will automatically:
  // 1. Find the existing user record by email
  // 2. Delete the old placeholder record
  // 3. Create a new record with the auth user ID, preserving tenant_id, role, etc.

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
  console.log("[v0] Trigger automatically linked auth user to tenant admin record with preserved data")

  return { user: data.user }
}
