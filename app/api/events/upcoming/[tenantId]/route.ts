import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "5", 10)

    console.log("[v0] API getUpcomingEvents - Fetching events for tenant:", tenantId)

    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user context for visibility
    const { data: userData } = await supabase.from("users").select("lot_id, family_unit_id").eq("id", user.id).single()

    const today = new Date().toISOString().split("T")[0]

    // Get user's RSVPs and saved events
    const [{ data: userRsvps }, { data: savedEvents }] = await Promise.all([
      supabase.from("event_rsvps").select("event_id").eq("user_id", user.id).in("rsvp_status", ["yes", "maybe"]),
      supabase.from("saved_events").select("event_id").eq("user_id", user.id),
    ])

    const rsvpedEventIds = new Set(userRsvps?.map((r) => r.event_id) || [])
    const savedEventIds = new Set(savedEvents?.map((s) => s.event_id) || [])
    const personalEventIds = [...new Set([...rsvpedEventIds, ...savedEventIds])]

    if (personalEventIds.length === 0) {
      return NextResponse.json([])
    }

    const { data: events, error } = await supabase
      .from("events")
      .select(
        `
        id,
        title,
        description,
        start_date,
        start_time,
        end_time,
        is_all_day,
        tenant_id,
        requires_rsvp,
        max_attendees,
        rsvp_deadline,
        status,
        location_type,
        location_id,
        custom_location_name,
        event_categories (
          name,
          icon
        ),
        location:locations!location_id(id, name, coordinates)
      `,
      )
      .eq("tenant_id", tenantId)
      .in("status", ["published", "cancelled"])
      .gte("start_date", today)
      .in("id", personalEventIds)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: false })
      .limit(limit)

    if (error) {
      console.error("[v0] API Error fetching upcoming events:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!events || events.length === 0) {
      return NextResponse.json([])
    }

    const eventIds = events.map((e) => e.id)

    // Get RSVPs and flag counts
    const [{ data: userRsvpStatuses }, { data: allRsvps }] = await Promise.all([
      supabase.from("event_rsvps").select("event_id, rsvp_status").eq("user_id", user.id).in("event_id", eventIds),
      supabase.from("event_rsvps").select("event_id, rsvp_status, attending_count").in("event_id", eventIds),
    ])

    // Get flag counts for each event
    const flagCountResults = await Promise.all(
      eventIds.map(async (eventId) => {
        const { data: count } = await supabase.rpc("get_event_flag_count", {
          p_event_id: eventId,
          p_tenant_id: tenantId,
        })
        return { eventId, count: count ?? 0 }
      }),
    )

    // Create lookup maps
    const rsvpMap = new Map(userRsvpStatuses?.map((r) => [r.event_id, r.rsvp_status]) || [])
    const savedSet = new Set(savedEvents?.map((s) => s.event_id) || [])
    const flagCountMap = new Map(flagCountResults.map((f) => [f.eventId, f.count]))

    // Calculate attending counts per event
    const attendingCountMap = new Map<string, number>()
    allRsvps?.forEach((rsvp) => {
      if (rsvp.rsvp_status === "yes") {
        attendingCountMap.set(rsvp.event_id, (attendingCountMap.get(rsvp.event_id) || 0) + (rsvp.attending_count || 1))
      }
    })

    // Enhance events with user data
    const eventsWithUserData = events.map((event) => ({
      ...event,
      user_rsvp_status: rsvpMap.get(event.id) || null,
      is_saved: savedSet.has(event.id),
      attending_count: attendingCountMap.get(event.id) || 0,
      flag_count: flagCountMap.get(event.id) || 0,
    }))

    return NextResponse.json(eventsWithUserData)
  } catch (error) {
    console.error("[v0] API Unexpected error fetching upcoming events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
