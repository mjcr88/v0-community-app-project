import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getEvents } from "@/lib/data/events"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params
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

    const today = new Date().toISOString().split("T")[0]

    // Fetch all upcoming community events (not just RSVP'd ones)
    // This is better UX - show what's happening in the community
    const events = await getEvents(tenantId, {
      startDate: today,
      status: ["published"],
      requestingUserId: user.id,
      enrichWithLocation: true,
      enrichWithCategory: true,
      enrichWithUserRsvp: true,
      enrichWithSavedStatus: true,
      enrichWithFlagCount: true,
      enrichWithRsvpCount: true,
    })

    // Apply limit manually since getEvents doesn't support limit yet
    // (It sorts by start_date, start_time correctly now)
    const limitedEvents = events.slice(0, limit)

    return NextResponse.json(limitedEvents)
  } catch (error) {
    console.error("[v0] API Unexpected error fetching upcoming events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
