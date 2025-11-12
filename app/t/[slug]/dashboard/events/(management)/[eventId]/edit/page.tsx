import { createServerClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getEvent } from "@/app/actions/events"
import { EditEventForm } from "./edit-event-form"

interface EditEventPageProps {
  params: Promise<{ slug: string; eventId: string }>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { slug, eventId } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  // Get tenant
  const { data: tenant } = await supabase.from("tenants").select("id, name").eq("slug", slug).single()

  if (!tenant) {
    redirect("/")
  }

  // Get user data
  const { data: userData } = await supabase
    .from("users")
    .select("id, tenant_id, role, is_tenant_admin")
    .eq("id", user.id)
    .single()

  if (!userData || userData.tenant_id !== tenant.id) {
    redirect(`/t/${slug}/login`)
  }

  // Get event
  const result = await getEvent(eventId, tenant.id)

  if (!result.success || !result.data) {
    notFound()
  }

  const event = result.data

  // Check permissions
  const isCreator = event.created_by === user.id
  const isAdmin = userData.is_tenant_admin || userData.role === "super_admin" || userData.role === "tenant_admin"

  if (!isCreator && !isAdmin) {
    redirect(`/t/${slug}/dashboard/events/${eventId}`)
  }

  // Fetch event categories
  const { data: categories } = await supabase
    .from("event_categories")
    .select("id, name, icon")
    .eq("tenant_id", tenant.id)
    .order("name")

  const { data: eventNeighborhoods } = await supabase
    .from("event_neighborhoods")
    .select("neighborhood_id")
    .eq("event_id", eventId)

  const selectedNeighborhoods = eventNeighborhoods?.map((en) => en.neighborhood_id) || []

  const { data: eventInvites } = await supabase
    .from("event_invites")
    .select("invitee_id, family_unit_id")
    .eq("event_id", eventId)

  const selectedResidents = eventInvites?.filter((ei) => ei.invitee_id).map((ei) => ei.invitee_id as string) || []

  const selectedFamilies =
    eventInvites?.filter((ei) => ei.family_unit_id).map((ei) => ei.family_unit_id as string) || []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Event</h2>
        <p className="text-muted-foreground">Update your community event</p>
      </div>

      <EditEventForm
        eventId={eventId}
        tenantSlug={slug}
        tenantId={tenant.id}
        categories={categories || []}
        initialData={{
          title: event.title,
          description: event.description || "",
          category_id: event.category_id,
          start_date: event.start_date,
          start_time: event.start_time || "",
          end_date: event.end_date || "",
          end_time: event.end_time || "",
          is_all_day: event.is_all_day,
          event_type: event.event_type as "resident" | "official",
          status: event.status as "draft" | "published" | "cancelled",
          requires_rsvp: event.requires_rsvp || false,
          rsvp_deadline: event.rsvp_deadline || "",
          max_attendees: event.max_attendees || null,
          visibility_scope: event.visibility_scope || "community",
          location_type: event.location_type,
          location_id: event.location_id,
          custom_location_name: event.custom_location_name,
          custom_location_coordinates: event.custom_location_coordinates,
          custom_location_type: event.custom_location_type,
        }}
        initialNeighborhoods={selectedNeighborhoods}
        initialResidents={selectedResidents}
        initialFamilies={selectedFamilies}
      />
    </div>
  )
}
