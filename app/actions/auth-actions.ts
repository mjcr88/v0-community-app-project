"use server"

import { cookies } from "next/headers"

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
