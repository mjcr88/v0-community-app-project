import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from 'next/navigation'
import { EditAnnouncementForm } from "./edit-announcement-form"

export default async function EditAnnouncementPage({
  params,
}: {
  params: { slug: string; announcementId: string }
}) {
  const { slug, announcementId } = params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("slug", slug)
    .single()

  if (!tenant) {
    notFound()
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("is_tenant_admin, role")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .single()

  const isTenantAdmin = userProfile?.is_tenant_admin || userProfile?.role === "super_admin" || userProfile?.role === "tenant_admin"

  if (!isTenantAdmin) {
    redirect(`/t/${slug}/dashboard`)
  }

  const { data: announcement } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", announcementId)
    .eq("tenant_id", tenant.id)
    .single()

  if (!announcement) {
    notFound()
  }

  // Fetch neighborhoods if applicable
  let selectedNeighborhoods: string[] = []
  if (announcement.visibility_scope === "neighborhood") {
    const { data: announcementNeighborhoods } = await supabase
      .from("announcement_neighborhoods")
      .select("neighborhood_id")
      .eq("announcement_id", announcement.id)

    selectedNeighborhoods = announcementNeighborhoods?.map((an: any) => an.neighborhood_id) || []
  }

  const { data: neighborhoods } = await supabase
    .from("neighborhoods")
    .select("id, name")
    .eq("tenant_id", tenant.id)
    .order("name")

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, category")
    .eq("tenant_id", tenant.id)
    .order("name")

  return (
    <div className="container max-w-4xl py-8">
      <EditAnnouncementForm
        announcement={announcement}
        selectedNeighborhoods={selectedNeighborhoods}
        neighborhoods={neighborhoods || []}
        locations={locations || []}
        slug={slug}
        tenantId={tenant.id}
      />
    </div>
  )
}
