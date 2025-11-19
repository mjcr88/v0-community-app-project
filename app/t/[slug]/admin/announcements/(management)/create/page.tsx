import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { AnnouncementForm } from "./announcement-form"

export default async function CreateAnnouncementPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase.from("tenants").select("id, name").eq("slug", slug).single()

  if (!tenant) {
    redirect("/")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("users")
    .select("is_tenant_admin, role")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .single()

  const isAdmin = profile?.is_tenant_admin || profile?.role === "super_admin" || profile?.role === "tenant_admin"

  if (!isAdmin) {
    redirect(`/t/${slug}/dashboard`)
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Announcement</h1>
        <p className="text-muted-foreground mt-2">Share important information with your community</p>
      </div>

      <AnnouncementForm tenantSlug={slug} tenantId={tenant.id} />
    </div>
  )
}
