import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
  try {
    const { tenantId } = await context.params
    console.log("[v0] Unread count API called for tenant:", tenantId)
    
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Auth user in unread count API:", user?.id || "NO USER")

    if (!user) {
      console.log("[v0] No user found, returning 401")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: count, error } = await supabase.rpc("get_unread_notification_count", {
      p_user_id: user.id,
    })

    if (error) {
      console.error("[v0] Error fetching unread count:", error)
      return NextResponse.json({ count: 0 })
    }

    console.log("[v0] Returning unread count:", count)
    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("[v0] Error in unread count API:", error)
    return NextResponse.json({ count: 0 })
  }
}
