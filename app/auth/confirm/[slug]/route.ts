import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Handles PKCE token exchange for password resets and other auth flows.
 * The tenant slug is encoded in the URL path (not as a query param) because
 * Supabase strips query parameters from redirect_to during its redirect chain.
 *
 * Uses the middleware-style cookie pattern: writes cookies directly onto the
 * redirect response object to ensure they survive the 307.
 *
 * Uses the request's Host header (not request.url) to construct redirect URLs.
 * Next.js with -H 0.0.0.0 sets request.url to 0.0.0.0 which differs from the
 * browser's actual hostname (e.g. localhost), causing cookie domain mismatches.
 *
 * Path: /auth/confirm/[slug]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get("token_hash")
    const code = searchParams.get("code")
    const type = searchParams.get("type") as "recovery" | "signup" | "invite" | "magiclink" | null

    // Use the Host header to construct redirect URLs so they match the browser's
    // actual hostname. This prevents cookie domain mismatches when Next.js uses
    // 0.0.0.0 as the bind address but the browser connects via localhost.
    const forwardedHost = request.headers.get("x-forwarded-host")
    const host = forwardedHost || request.headers.get("host") || "localhost:3000"
    const protocol = request.headers.get("x-forwarded-proto") || "http"
    const origin = `${protocol}://${host}`

    const updatePasswordUrl = new URL(`/t/${slug}/update-password`, origin)
    const errorUrl = new URL(`/t/${slug}/login`, origin)
    errorUrl.searchParams.set("error", "The reset link is invalid or has expired.")

    let response = NextResponse.redirect(updatePasswordUrl)

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return response
        }
        console.error("[Auth] Code Exchange Error:", error.message)
    } else if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash })
        if (!error) {
            return response
        }
        console.error("[Auth] PKCE Verification Error:", error.message)
    } else {
        console.error("[Auth] No code or token_hash in auth/confirm request")
    }

    return NextResponse.redirect(errorUrl)
}
