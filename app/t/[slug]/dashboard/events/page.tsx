import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { EventsPageClient } from "./events-page-client"
import { applyVisibilityFilter } from "@/lib/visibility-filter"

export default async function EventsPage({
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

  const { data: resident } = await supabase
    .from("users")
    .select("id, tenant_id, lot_id, family_unit_id, lots(neighborhoods(id))")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  const { data: categories } = await supabase
    .from("event_categories")
    .select("id, name, icon")
    .eq("tenant_id", resident.tenant_id)
    .order("name")

  const visibleEventIds = await applyVisibilityFilter(resident.tenant_id, {
    userId: user.id,
    tenantId: resident.tenant_id,
    userLotId: resident.lot_id,
    userFamilyUnitId: resident.family_unit_id,
  })

  const { data: events } = await supabase
    .from("events")
    .select(
      `
      *,
      event_categories (
        id,
        name,
        icon
      ),
      creator:users!created_by (
        first_name,
        last_name,
        profile_picture_url
      ),
      location:locations!location_id(id, name, coordinates)
    `,
    )
    .eq("tenant_id", resident.tenant_id)
    .in("id", visibleEventIds)
    .eq("status", "published")
    .order("start_date", { ascending: true })
    .order("start_time", { ascending: true })

  const eventIds = (events || []).map((e) => e.id)

  const [{ data: allRsvps }, { data: savedEvents }, { data: eventFlags }] = await Promise.all([
    supabase.from("event_rsvps").select("event_id, rsvp_status, user_id").in("event_id", eventIds),
    supabase.from("saved_events").select("event_id").eq("user_id", user.id).in("event_id", eventIds),
    supabase.from("event_flags").select("event_id").in("event_id", eventIds),
  ])

  // Build lookup maps for O(1) access
  const attendingCountMap = new Map<string, number>()
  const userRsvpMap = new Map<string, string>()
  const savedEventsSet = new Set<string>(savedEvents?.map((s) => s.event_id) || [])
  const flagCountMap = new Map<string, number>()

  eventFlags?.forEach((flag) => {
    flagCountMap.set(flag.event_id, (flagCountMap.get(flag.event_id) || 0) + 1)
  })

  console.log("[v0] Flag counts map:", Object.fromEntries(flagCountMap))

  allRsvps?.forEach((rsvp) => {
    // Count attending
    if (rsvp.rsvp_status === "yes") {
      attendingCountMap.set(rsvp.event_id, (attendingCountMap.get(rsvp.event_id) || 0) + 1)
    }
    // Track user's RSVP
    if (rsvp.user_id === user.id) {
      userRsvpMap.set(rsvp.event_id, rsvp.rsvp_status)
    }
  })

  // Map the data efficiently
  const eventsWithUserData = (events || []).map((event) => ({
    ...event,
    attending_count: attendingCountMap.get(event.id) || 0,
    user_rsvp_status: userRsvpMap.get(event.id) || null,
    is_saved: savedEventsSet.has(event.id),
    flag_count: flagCountMap.get(event.id) || 0,
  }))

  console.log(
    "[v0] Events with flag counts:",
    eventsWithUserData.map((e) => ({ id: e.id, title: e.title, flag_count: e.flag_count })),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Events</h2>
          <p className="text-muted-foreground">Discover and join community events</p>
        </div>
        <Button asChild>
          <Link href={`/t/${slug}/dashboard/events/create`}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      <EventsPageClient
        events={eventsWithUserData}
        categories={categories || []}
        slug={slug}
        userId={user.id}
        tenantId={resident.tenant_id}
      />
    </div>
  )
}
