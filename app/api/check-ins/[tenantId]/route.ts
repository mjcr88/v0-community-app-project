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

    const checkIns = await getCheckIns(tenantId, {
      activeOnly: true,
      enrichWithCreator: true,
      enrichWithLocation: true,
      enrichWithRsvp: true,
    })

    // Apply visibility filtering in memory to support "Community OR My Private Check-ins"
    const visibleCheckIns = checkIns.filter((checkIn) => {
      if (checkIn.visibility_scope === "community") {
        return true
      }
      if (checkIn.created_by === user.id) {
        return true
      }
      return false
    })

    return NextResponse.json(visibleCheckIns)
  } catch (error) {
    console.error("[v0] API Unexpected error fetching active check-ins:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
