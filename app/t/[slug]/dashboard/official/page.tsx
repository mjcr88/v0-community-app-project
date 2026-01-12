import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { getDocuments } from '@/app/actions/resident-documents'
import { getAnnouncements } from '@/app/actions/announcements'
import { OfficialTabs } from '@/components/dashboard/official-tabs'

export default async function OfficialPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    // Authentication check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/t/${slug}/login`)

    const { data: tenant } = await supabase.from("tenants").select("id, name, announcements_enabled, documents_enabled").eq("slug", slug).single()
    if (!tenant) redirect("/backoffice/login")

    // Fetch data in parallel
    const [docsResult, announcementsResult] = await Promise.all([
        tenant.documents_enabled !== false ? getDocuments(tenant.id) : Promise.resolve({ success: true, data: [] }),
        tenant.announcements_enabled !== false ? getAnnouncements(tenant.id, user.id) : Promise.resolve({ success: true, data: [] })
    ])

    const documents = docsResult.success ? docsResult.data || [] : []
    const announcements = announcementsResult.success ? announcementsResult.data || [] : []

    return (
        <div className="space-y-6">
            <OfficialTabs
                announcements={announcements}
                documents={documents}
                slug={slug}
                userId={user.id}
                tenantId={tenant.id}
                announcementsEnabled={tenant.announcements_enabled !== false}
                documentsEnabled={tenant.documents_enabled !== false}
            />
        </div>
    )
}
