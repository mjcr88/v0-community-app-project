"use server"

import { createClient } from "@supabase/supabase-js"

export async function validateInviteToken(token: string, tenantId: string) {
  console.log("[v0] Validating invite token:", { token, tenantId })

  // Create a Supabase client with service role to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[v0] Missing Supabase credentials")
    return {
      success: false,
      error: "Server configuration error",
      resident: null,
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: resident, error: residentError } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, invite_token, tenant_id")
    .eq("invite_token", token)
    .eq("tenant_id", tenantId)
    .eq("role", "resident")
    .maybeSingle()

  console.log("[v0] Resident query result:", { resident, residentError })

  if (residentError) {
    return {
      success: false,
      error: `Database error: ${residentError.message}`,
      resident: null,
    }
  }

  if (!resident) {
    return {
      success: false,
      error: "No resident found with this invite token",
      resident: null,
    }
  }

  if (resident.invite_token !== token) {
    return {
      success: false,
      error: "Token mismatch",
      resident: null,
    }
  }

  // Validate that resident has a valid email
  if (!resident.email || resident.email.trim() === "") {
    return {
      success: false,
      error: "Resident email is missing. Please contact your administrator to update your email address.",
      resident: null,
    }
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(resident.email)) {
    return {
      success: false,
      error: "Invalid email format. Please contact your administrator to update your email address.",
      resident: null,
    }
  }

  return {
    success: true,
    error: null,
    resident,
  }
}
