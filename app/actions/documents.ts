"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const DocumentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    content: z.string().optional(),
    category: z.enum(["regulation", "financial", "construction", "hoa"]),
    document_type: z.enum(["page", "pdf"]),
    status: z.enum(["draft", "published", "archived"]),
    file_url: z.string().optional(),
    cover_image_url: z.string().optional(),
    is_featured: z.boolean().optional(),
    change_summary: z.string().optional(),
})

export async function upsertDocument(formData: FormData, tenantId: string, slug: string, documentId?: string) {
    const supabase = await createClient()

    // Validate user permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: userData } = await supabase
        .from("users")
        .select("role, tenant_id, is_tenant_admin")
        .eq("id", user.id)
        .single()

    const isSuperAdmin = userData?.role === "super_admin"
    const isTenantAdmin = (userData?.role === "tenant_admin" && userData?.tenant_id === tenantId) || userData?.is_tenant_admin

    if (!isSuperAdmin && !isTenantAdmin) {
        throw new Error("Unauthorized")
    }

    // Parse and validate form data
    const rawData = {
        title: formData.get("title"),
        description: formData.get("description"),
        content: formData.get("content"),
        category: formData.get("category"),
        document_type: formData.get("document_type"),
        status: formData.get("status"),
        file_url: formData.get("file_url"),
        cover_image_url: formData.get("cover_image_url"),
        is_featured: formData.get("is_featured") === "true",
        change_summary: formData.get("change_summary"),
    }

    const validated = DocumentSchema.parse(rawData)

    // Construct DB payload
    const payload = {
        tenant_id: tenantId,
        title: validated.title,
        description: validated.description,
        content: validated.content,
        category: validated.category,
        document_type: validated.document_type,
        status: validated.status,
        file_url: validated.file_url,
        cover_image_url: validated.cover_image_url,
        is_featured: validated.is_featured,
        created_by: documentId ? undefined : user.id, // Only set on create
        updated_at: new Date().toISOString(),
    }

    let resultId = documentId

    if (documentId) {
        // Update existing document
        const { error } = await supabase
            .from("documents")
            .update(payload)
            .eq("id", documentId)

        if (error) throw new Error(error.message)
    } else {
        // Create new document
        const { data, error } = await supabase
            .from("documents")
            .insert(payload)
            .select("id")
            .single()

        if (error) throw new Error(error.message)
        resultId = data.id
    }

    // Handle changelog if summary provided
    if (validated.change_summary && resultId) {
        await supabase.from("document_changelog").insert({
            document_id: resultId,
            change_summary: validated.change_summary,
            changed_by: user.id
        })
    }

    revalidatePath(`/t/${slug}/admin/documents`)
    return { success: true, id: resultId }
}

export async function markDocumentAsRead(documentId: string, slug: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

    if (!userData) return { success: false, error: "Tenant not found" }

    try {
        await supabase
            .from("document_reads")
            .insert({
                document_id: documentId,
                user_id: user.id,
                tenant_id: userData.tenant_id
            })
            // Ignore if already exists
            .select()
    } catch (error) {
        // Ignore duplicate key errors, which mean it's already read
        console.error("Error marking document as read:", error)
    }

    revalidatePath(`/t/${slug}/dashboard/official`)
    return { success: true }
}
