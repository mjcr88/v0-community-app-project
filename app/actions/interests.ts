"use server"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Creates a new interest securely using the service role client.
 * This is used to allow residents to add interests while adhering to 
 * the "Backend-First" security architecture (no direct client-side INSERTs).
 */
export async function createInterestAction(name: string, tenantId: string) {
    if (!name || !tenantId) {
        throw new Error("Missing required parameters: name and tenantId")
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from("interests")
        .insert({
            name: name.trim(),
            tenant_id: tenantId,
        })
        .select()
        .single()

    if (error) {
        console.error("Error in createInterestAction:", error)
        throw new Error(error.message)
    }

    return data
}
