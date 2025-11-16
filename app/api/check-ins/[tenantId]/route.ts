import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] API getActiveCheckIns - Fetching check-ins for tenant:", tenantId)

    const { data: checkIns, error } = await supabase
      .from("check_ins")
      .select(
        `
        *,
        creator:users!created_by(id, first_name, last_name, profile_picture_url),
        location:locations!location_id(id, name, coordinates, boundary_coordinates, path_coordinates)
      `,
      )
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .filter("start_time", "gte", new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString())
      .order("start_time", { ascending: false })

    if (error) {
      console.error("[v0] API Error fetching active check-ins:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const now = new Date()
    const nonExpiredCheckIns = (checkIns || []).filter((checkIn) => {
      const expiresAt = new Date(checkIn.start_time)
      expiresAt.setMinutes(expiresAt.getMinutes() + checkIn.duration_minutes + 5)
      return expiresAt > now
    })

    const visibleCheckIns = nonExpiredCheckIns.filter((checkIn) => {
      if (checkIn.visibility_scope === "community") {
        return true
      }
      if (checkIn.created_by === user.id) {
        return true
      }
      return false
    })

    const checkInIds = visibleCheckIns.map((c) => c.id)

    if (checkInIds.length === 0) {
      return NextResponse.json([])
    }

    const [{ data: userRsvps }, { data: allRsvps }] = await Promise.all([
      supabase
        .from("check_in_rsvps")
        .select("check_in_id, rsvp_status")
        .eq("user_id", user.id)
        .in("check_in_id", checkInIds),
      supabase.from("check_in_rsvps").select("check_in_id, rsvp_status, attending_count").in("check_in_id", checkInIds),
    ])

    const rsvpMap = new Map(userRsvps?.map((r) => [r.check_in_id, r.rsvp_status]) || [])

    const attendingCountMap = new Map<string, number>()
    allRsvps?.forEach((rsvp) => {
      if (rsvp.rsvp_status === "yes") {
        const current = attendingCountMap.get(rsvp.check_in_id) || 0
        attendingCountMap.set(rsvp.check_in_id, current + (rsvp.attending_count || 1))
      }
    })

    const checkInsWithUserData = visibleCheckIns.map((checkIn) => ({
      ...checkIn,
      user_rsvp_status: rsvpMap.get(checkIn.id) || null,
      attending_count: attendingCountMap.get(checkIn.id) || 0,
    }))

    return NextResponse.json(checkInsWithUserData)
  } catch (error) {
    console.error("[v0] API Unexpected error fetching active check-ins:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
