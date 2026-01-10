import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { DocumentForm } from "@/components/admin/document-form"

export default async function EditDocumentPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/t/${slug}/login`)

    const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", slug).single()
    if (!tenant) redirect("/backoffice/login")

    const { data: document } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single()

    if (!document) notFound()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Edit Document</h2>
                <p className="text-muted-foreground">Update document content and settings.</p>
            </div>

            <DocumentForm tenantId={tenant.id} slug={slug} document={document} />
        </div>
    )
}
