"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDocuments(tenantId: string) {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    // Fetch documents (RLS will filter by tenant and status 'published')
    const { data: documents, error } = await supabase
        .from("documents")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("status", "published")
        .order("is_featured", { ascending: false }) // Featured first
        .order("updated_at", { ascending: false })

    if (error) {
        console.error("Error fetching documents:", error)
        return { success: false, error: error.message }
    }

    // Fetch read status for current user
    const { data: reads } = await supabase
        .from("document_reads")
        .select("document_id")
        .eq("user_id", user.id)

    const readDocIds = new Set(reads?.map(r => r.document_id) || [])

    const documentsWithReadStatus = documents.map(doc => ({
        ...doc,
        is_read: readDocIds.has(doc.id)
    }))

    return { success: true, data: documentsWithReadStatus }
}
