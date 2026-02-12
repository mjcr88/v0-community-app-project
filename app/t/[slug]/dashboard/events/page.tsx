import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"
import Link from "next/link"
import { EventsPageClient } from "./events-page-client"
import { applyVisibilityFilter } from "@/lib/visibility-filter"
import { Button } from "@/components/ui/button"

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

  const { data: communityLocations } = await supabase
    .from("locations")
    .select("id, name, type")
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
    .in("status", ["published", "cancelled"])
    // Let client handle date filtering for past/upcoming toggle
    .order("start_date", { ascending: true })
    .order("start_time", { ascending: true })

  const eventIds = (events || []).map((e) => e.id)

  // Get all attending counts in one query
  const { data: allRsvps } = await supabase
    .from("event_rsvps")
    .select("event_id, rsvp_status, user_id")
    .in("event_id", eventIds)

  // Get user's saved events in one query
  const { data: savedEvents } = await supabase
    .from("saved_events")
    .select("event_id")
    .eq("user_id", user.id)
    .in("event_id", eventIds)

  const flagCountResults = await Promise.all(
    eventIds.map(async (eventId) => {
      const { data: count } = await supabase.rpc("get_event_flag_count", {
        p_event_id: eventId,
        p_tenant_id: resident.tenant_id,
      })
      return { eventId, count: count ?? 0 }
    }),
  )

  // Build lookup maps for O(1) access
  const attendingCountMap = new Map<string, number>()
  const userRsvpMap = new Map<string, string>()
  const attendeeIdsMap = new Map<string, string[]>() // For "X friends going"
  const savedEventsSet = new Set<string>(savedEvents?.map((s) => s.event_id) || [])
  const flagCountMap = new Map<string, number>()
  flagCountResults.forEach(({ eventId, count }) => {
    flagCountMap.set(eventId, count)
  })

  allRsvps?.forEach((rsvp) => {
    // Count attending and collect attendee IDs
    if (rsvp.rsvp_status === "yes") {
      attendingCountMap.set(rsvp.event_id, (attendingCountMap.get(rsvp.event_id) || 0) + 1)
      const existingIds = attendeeIdsMap.get(rsvp.event_id) || []
      existingIds.push(rsvp.user_id)
      attendeeIdsMap.set(rsvp.event_id, existingIds)
    }
    // Track user's RSVP
    if (rsvp.user_id === user.id) {
      userRsvpMap.set(rsvp.event_id, rsvp.rsvp_status)
    }
  })

  // Fetch user's neighbor list member IDs for "X friends going"
  const { data: neighborLists } = await supabase
    .from("neighbor_lists")
    .select(`
      id,
      members:neighbor_list_members(neighbor_id)
    `)
    .eq("owner_id", user.id)
    .eq("tenant_id", resident.tenant_id)

  const friendIds: string[] = []
  neighborLists?.forEach((list) => {
    list.members?.forEach((m: { neighbor_id: string }) => {
      if (m.neighbor_id && !friendIds.includes(m.neighbor_id)) {
        friendIds.push(m.neighbor_id)
      }
    })
  })

  // Map the data efficiently
  const eventsWithUserData = (events || []).map((event) => ({
    ...event,
    attending_count: attendingCountMap.get(event.id) || 0,
    user_rsvp_status: userRsvpMap.get(event.id) || null,
    is_saved: savedEventsSet.has(event.id),
    flag_count: flagCountMap.get(event.id) || 0,
    attendee_ids: attendeeIdsMap.get(event.id) || [],
  }))

  // Filter out "Test" category
  const filteredCategories = categories?.filter(c => c.name !== "Test") || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Discover and join community events</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/t/${slug}/dashboard/events/create`}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="md:hidden">Create</span>
            <span className="hidden md:inline">Create Event</span>
          </Link>
        </Button>
      </div>

      <EventsPageClient
        events={eventsWithUserData}
        categories={filteredCategories}
        slug={slug}
        userId={user.id}
        tenantId={resident.tenant_id}
        friendIds={friendIds}
        locations={communityLocations || []}
      />
    </div>
  )
}
