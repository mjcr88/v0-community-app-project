import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
  try {
    const { tenantId } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: count, error } = await supabase.rpc("get_unread_notification_count", {
      p_user_id: user.id,
    })

    if (error) {
      console.error("[v0] Error fetching unread count:", error)
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("[v0] Error in unread count API:", error)
    return NextResponse.json({ count: 0 })
  }
}
