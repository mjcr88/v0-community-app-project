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

    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date().toISOString()

    const { data: events, error } = await supabase
      .from("events")
      .select(
        `
        id,
        title,
        description,
        start_time,
        end_time,
        created_by,
        visibility_scope,
        location:locations!location_id (
          id,
          name,
          coordinates,
          boundary_coordinates,
          path_coordinates
        ),
        category:event_categories (
          id,
          name,
          color
        ),
        creator:users!created_by (
          id,
          first_name,
          last_name,
          profile_picture_url
        )
      `,
      )
      .eq("tenant_id", tenantId)
      .gte("start_time", now)
      .order("start_time", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("[v0] API Error fetching upcoming events:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const eventsWithFlags = await Promise.all(
      (events || []).map(async (event) => {
        const { data: flagCount } = await supabase.rpc("get_event_flag_count", {
          p_event_id: event.id,
          p_tenant_id: tenantId,
        })
        return {
          ...event,
          flag_count: flagCount ?? 0,
        }
      }),
    )

    return NextResponse.json(eventsWithFlags)
  } catch (error) {
    console.error("[v0] API Unexpected error fetching upcoming events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
