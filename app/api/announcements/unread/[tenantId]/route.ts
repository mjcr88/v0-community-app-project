import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  try {
    const supabase = await createClient()
    const { tenantId } = params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's neighborhoods
    const { data: userData } = await supabase
      .from("users")
      .select("id, lot_id, lots(neighborhoods(id))")
      .eq("id", user.id)
      .single()

    const neighborhoodIds = userData?.lots?.neighborhoods?.id ? [userData.lots.neighborhoods.id] : []

    // Get published announcements visible to user
    let query = supabase
      .from("announcements")
      .select("id, title, type, priority, content, published_at, auto_archive_date, scope")
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .or("auto_archive_date.is.null,auto_archive_date.gte." + new Date().toISOString())
      .order("priority", { ascending: true }) // urgent first
      .order("published_at", { ascending: false })
      .limit(5)

    // Apply scope filter
    if (neighborhoodIds.length > 0) {
      // Get announcements that are community-wide OR targeted to user's neighborhood
      const { data: neighborhoodAnnouncements } = await supabase
        .from("announcement_neighborhoods")
        .select("announcement_id")
        .in("neighborhood_id", neighborhoodIds)

      const neighborhoodAnnouncementIds = neighborhoodAnnouncements?.map((a) => a.announcement_id) || []

      // Community-wide OR in user's neighborhood
      query = query.or(`scope.eq.community_wide,id.in.(${neighborhoodAnnouncementIds.join(",") || "null"})`)
    } else {
      // Only community-wide if no neighborhood
      query = query.eq("scope", "community_wide")
    }

    const { data: announcements } = await query

    // Get read status for these announcements
    const announcementIds = (announcements || []).map((a) => a.id)
    const { data: readAnnouncements } = await supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", user.id)
      .in("announcement_id", announcementIds)

    const readIds = new Set(readAnnouncements?.map((r) => r.announcement_id) || [])

    // Filter to only unread
    const unread = (announcements || []).filter((a) => !readIds.has(a.id))

    // Get total unread count
    const { count: totalUnread } = await supabase
      .from("announcements")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .or("auto_archive_date.is.null,auto_archive_date.gte." + new Date().toISOString())
      .not("id", "in", `(${Array.from(readIds).join(",") || "null"})`)

    return NextResponse.json({
      announcements: unread,
      unreadCount: totalUnread || 0,
    })
  } catch (error) {
    console.error("[v0] Error fetching unread announcements:", error)
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 })
  }
}
