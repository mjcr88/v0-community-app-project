import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const supabase = await createClient()
    const { tenantId } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("id, lot_id")
      .eq("id", user.id)
      .single()

    console.log("[v0] User data for announcements:", userData)

    // Get neighborhood from lot
    let neighborhoodIds: string[] = []
    if (userData?.lot_id) {
      const { data: lotData } = await supabase
        .from("lots")
        .select("neighborhood_id")
        .eq("id", userData.lot_id)
        .single()

      if (lotData?.neighborhood_id) {
        neighborhoodIds = [lotData.neighborhood_id]
      }
    }

    console.log("[v0] User neighborhood IDs:", neighborhoodIds)

    const now = new Date().toISOString()

    const { data: allAnnouncements } = await supabase
      .from("announcements")
      .select("id, title, announcement_type, priority, description, published_at, auto_archive_date")
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .or(`auto_archive_date.is.null,auto_archive_date.gte.${now}`)
      .order("published_at", { ascending: false })

    console.log("[v0] All published announcements:", allAnnouncements?.length)

    if (!allAnnouncements) {
      return NextResponse.json({ announcements: [], unreadCount: 0 })
    }

    const visibleAnnouncements = await Promise.all(
      allAnnouncements.map(async (announcement) => {
        // Check if announcement has neighborhood targeting
        const { data: targetedNeighborhoods } = await supabase
          .from("announcement_neighborhoods")
          .select("neighborhood_id")
          .eq("announcement_id", announcement.id)

        const isCommunityWide = !targetedNeighborhoods || targetedNeighborhoods.length === 0
        const isTargetedToUser = targetedNeighborhoods?.some(
          (n) => neighborhoodIds.includes(n.neighborhood_id)
        )

        // User can see if it's community-wide OR targeted to their neighborhood
        if (isCommunityWide || isTargetedToUser) {
          return announcement
        }
        return null
      })
    )

    // Filter out nulls
    const filtered = visibleAnnouncements.filter((a): a is NonNullable<typeof a> => a !== null)

    console.log("[v0] Visible announcements after filtering:", filtered.length)

    // Sort by priority then date
    const sortedAnnouncements = filtered.sort((a, b) => {
      const priorityOrder = { urgent: 0, important: 1, normal: 2 }
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] -
        priorityOrder[b.priority as keyof typeof priorityOrder]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    })

    // Get read status
    const announcementIdsToCheck = sortedAnnouncements.map((a) => a.id)
    const { data: readAnnouncements } = await supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", user.id)
      .in("announcement_id", announcementIdsToCheck)

    const readIds = new Set(readAnnouncements?.map((r) => r.announcement_id) || [])

    console.log("[v0] Read announcement IDs:", Array.from(readIds))

    const recentAnnouncements = sortedAnnouncements.slice(0, 5)

    // Get total unread count for badge
    const totalUnread = sortedAnnouncements.filter((a) => !readIds.has(a.id)).length

    console.log("[v0] Returning announcements:", recentAnnouncements.length, "with", totalUnread, "unread")

    return NextResponse.json({
      announcements: recentAnnouncements,
      unreadCount: totalUnread,
    })
  } catch (error) {
    console.error("[v0] Error fetching unread announcements:", error)
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 })
  }
}
