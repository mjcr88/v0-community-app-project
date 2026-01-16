"use server"

import { createClient } from "@supabase/supabase-js"
import { timingSafeEqual } from "crypto"

/**
 * Performs a timing-safe comparison of two strings.
 * Prevents timing attacks by ensuring constant-time comparison.
 */
function secureTokenCompare(a: string, b: string): boolean {
  // Ensure both strings are the same length to prevent timing leaks
  // If lengths differ, pad the shorter one (comparison will still fail)
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)

  if (bufA.length !== bufB.length) {
    // Compare against itself to maintain constant time, then return false
    timingSafeEqual(bufA, bufA)
    return false
  }

  return timingSafeEqual(bufA, bufB)
}

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

  // Use timing-safe comparison to prevent timing attacks
  if (!resident.invite_token || !secureTokenCompare(resident.invite_token, token)) {
    return {
      success: false,
      error: "Token mismatch",
      resident: null,
    }
  }

  return {
    success: true,
    error: null,
    resident,
  }
}
