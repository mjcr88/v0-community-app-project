import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with service_role privileges.
 * ONLY use in server-side code (API routes, server actions).
 * Bypasses RLS — use with caution.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        || process.env.DEV_SUPABASE_SERVICE_ROLE_KEY
        || process.env.SUPABASE_SERVICE_ROLE_KEY_DEV

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            `Missing Supabase admin credentials: ${!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : 'SUPABASE_SERVICE_ROLE_KEY'}`
        )
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
