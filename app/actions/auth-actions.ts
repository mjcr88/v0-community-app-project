"use server"

import { cookies, headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const REMEMBER_ME_COOKIE = "remember-me"
const LAST_ACTIVE_COOKIE = "last-active"
const TWO_HOURS_MS = 2 * 60 * 60 * 1000
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Sets or clears the session persistence cookies based on "Remember Me" choice.
 * 
 * Logic:
 * - If rememberMe is TRUE: Set a long-lived "remember-me" cookie.
 * - If rememberMe is FALSE: Clear "remember-me" cookie and set "last-active" timestamp.
 */
export async function setSessionPersistence(rememberMe: boolean) {
    const cookieStore = await cookies()

    if (rememberMe) {
        // Trusted Device: Set persistent cookie
        cookieStore.set(REMEMBER_ME_COOKIE, "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: THIRTY_DAYS_MS / 1000,
            path: "/",
        })

        // Cleanup strict mode cookie if it exists
        cookieStore.delete(LAST_ACTIVE_COOKIE)
    } else {
        // Strict Mode: Clear persistent cookie
        cookieStore.delete(REMEMBER_ME_COOKIE)

        // Initialize activity timer
        cookieStore.set(LAST_ACTIVE_COOKIE, Date.now().toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: TWO_HOURS_MS / 1000, // Cookie itself expires in 2h
            path: "/",
        })
    }

    console.log(`[Auth] Session persistence set. RememberMe: ${rememberMe}`)
}

/**
 * Triggers the Supabase password reset email flow.
 */
export async function resetPassword(email: string, tenantSlug: string) {
    try {
        const supabase = await createClient()
        const normalizedEmail = email.toLowerCase().trim()

        // Build a reliable absolute origin. The `origin` header may be absent
        // for same-origin requests in some browsers. Fall back to a trusted
        // env var or construct from the `host` header.
        const headersList = await headers()
        const origin =
            headersList.get("origin") ||
            process.env.NEXT_PUBLIC_APP_URL ||
            (headersList.get("host")
                ? `${headersList.get("x-forwarded-proto") || "https"}://${headersList.get("host")}`
                : "")

        // 1. Look up the tenant by slug
        const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .select("id")
            .eq("slug", tenantSlug)
            .maybeSingle()

        if (tenantError || !tenant) {
            // Don't reveal tenant existence; always return success
            console.error("[Auth] Reset password: tenant not found for slug:", tenantSlug)
            return { success: true }
        }

        // 2. Check if the email belongs to a user who is a resident of this tenant.
        const { data: resident, error: residentError } = await supabase
            .rpc("check_resident_email", {
                p_email: normalizedEmail,
                p_tenant_id: tenant.id,
            })

        // Fail-closed: any RPC error (including function-not-found) blocks the send
        // to preserve tenant gating.
        if (residentError) {
            console.error("[Auth] check_resident_email RPC error, aborting reset for safety:", residentError.message)
            return { success: true }
        }
        if (!resident) {
            console.log("[Auth] Reset password: email not found as resident in tenant", tenantSlug)
            return { success: true }
        }

        // 3. Send the reset email only for verified residents
        // Encode the tenant slug in the URL path (not a query param) because
        // Supabase strips query parameters from redirect_to during its own redirect chain.
        const redirectTo = `${origin}/auth/confirm/${tenantSlug}`

        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo,
        })

        if (error) {
            console.error("[Auth] Reset password error:", error.message)
            // Don't expose Supabase errors to the user (e.g., rate limits)
            // Return success to prevent info leakage
            return { success: true }
        }

        return { success: true }
    } catch (err: any) {
        console.error("[Auth] Unexpected reset password error:", err)
        // Always return success to prevent email enumeration
        return { success: true }
    }
}

/**
 * Updates the user's password using the current recovery session.
 */
export async function updatePassword(password: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            console.error("[Auth] Update password error:", error.message)
            return { error: error.message }
        }

        return { success: true }
    } catch (err: any) {
        console.error("[Auth] Unexpected update password error:", err)
        return { error: "An unexpected error occurred." }
    }
}
