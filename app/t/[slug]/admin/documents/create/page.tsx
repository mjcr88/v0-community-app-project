import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DocumentForm } from "@/components/admin/document-form"

export default async function CreateDocumentPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/t/${slug}/login`)

    const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", slug).single()
    if (!tenant) redirect("/backoffice/login")

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Create Document</h2>
                <p className="text-muted-foreground">Add a new document to the official library.</p>
            </div>

            <DocumentForm tenantId={tenant.id} slug={slug} />
        </div>
    )
}
