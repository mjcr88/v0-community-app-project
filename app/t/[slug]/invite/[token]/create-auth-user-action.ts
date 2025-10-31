"use server"

import { createClient } from "@/lib/supabase/server"

export async function createAuthUserAction(email: string, password: string) {
  const supabase = await createClient()

  console.log("[v0] Creating auth user with admin API:", email)

  // Use admin API to create user
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
  return { user: data.user }
}
