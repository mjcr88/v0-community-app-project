import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getCheckIns } from "@/lib/data/check-ins"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] API getActiveCheckIns - Fetching check-ins for tenant:", tenantId)

    // Get user's family_unit_id for family invite checks
    const { data: userData } = await supabase
      .from("users")
      .select("family_unit_id")
      .eq("id", user.id)
      .single()

    const checkIns = await getCheckIns(tenantId, {
      activeOnly: true,
      enrichWithCreator: true,
      enrichWithLocation: true,
      enrichWithRsvp: true,
      enrichWithInvites: true, // Need invites for visibility filtering
    })

    // Apply visibility filtering in memory to support "Community OR My Private Check-ins"
    const visibleCheckIns = checkIns.filter((checkIn) => {
      // 1. Community check-ins are visible to everyone
      if (checkIn.visibility_scope === "community") {
        return true
      }

      // 2. Creator can always see their own check-ins
      if (checkIn.created_by === user.id) {
        return true
      }

      // 3. Private check-ins: visible if invited (directly or via family)
      if (checkIn.visibility_scope === "private" && checkIn.invites) {
        // Check if user is directly invited
        const isDirectlyInvited = checkIn.invites.some((invite) => invite.invitee_id === user.id)
        if (isDirectlyInvited) return true

        // Check if user's family is invited
        if (userData?.family_unit_id) {
          const isFamilyInvited = checkIn.invites.some((invite) => invite.family_unit_id === userData.family_unit_id)
          if (isFamilyInvited) return true
        }
      }

      return false
    })

    console.log("[v0] API getActiveCheckIns - Filtered:", { total: checkIns.length, visible: visibleCheckIns.length })

    return NextResponse.json(visibleCheckIns)
  } catch (error) {
    console.error("[v0] API Unexpected error fetching active check-ins:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
