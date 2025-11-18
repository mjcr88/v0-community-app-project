import { createServerClient } from "@/lib/supabase/server"
import { redirect, notFound } from 'next/navigation'
import { EditAnnouncementForm } from "./edit-announcement-form"

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ slug: string; announcementId: string }>
}) {
  const { slug, announcementId } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect("/backoffice/login")
  }

  // Verify admin
  const { data: userData } = await supabase
    .from("users")
    .select("role, is_tenant_admin")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!userData || (!["tenant_admin", "super_admin"].includes(userData.role) && !userData.is_tenant_admin)) {
    redirect(`/t/${slug}/dashboard`)
  }

  // Fetch announcement with neighborhoods
  const { data: announcement, error } = await supabase
    .from("announcements")
    .select(
      `
      *,
      neighborhoods:announcement_neighborhoods(neighborhood_id)
    `,
    )
    .eq("id", announcementId)
    .eq("tenant_id", tenant.id)
    .single()

  if (error || !announcement) {
    notFound()
  }

  // Map database location_type back to UI format
  let uiLocationType: "community" | "custom" | "none" = "none"
  if (announcement.location_type === "community_location") {
    uiLocationType = "community"
  } else if (announcement.location_type === "custom_temporary") {
    uiLocationType = "custom"
  }

  const initialData = {
    title: announcement.title,
    description: announcement.description || "",
    announcement_type: announcement.announcement_type,
    priority: announcement.priority,
    event_id: announcement.event_id,
    location_type: uiLocationType,
    location_id: announcement.location_id,
    custom_location_name: announcement.custom_location_name || "",
    custom_location_lat: announcement.custom_location_lat,
    custom_location_lng: announcement.custom_location_lng,
    images: announcement.images || [],
    auto_archive_date: announcement.auto_archive_date
      ? new Date(announcement.auto_archive_date).toISOString().slice(0, 16)
      : "",
  }

  const initialNeighborhoods = announcement.neighborhoods?.map((n: any) => n.neighborhood_id) || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Announcement</h2>
        <p className="text-muted-foreground">Update announcement details and republish to notify residents</p>
      </div>

      <EditAnnouncementForm
        announcementId={announcementId}
        tenantSlug={slug}
        tenantId={tenant.id}
        initialData={initialData}
        initialNeighborhoods={initialNeighborhoods}
      />
    </div>
  )
}
