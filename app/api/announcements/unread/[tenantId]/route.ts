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

    const { data: userData } = await supabase
      .from("users")
      .select("id, lot_id")
      .eq("id", user.id)
      .single()

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

    let announcementIds: string[] = []
    
    if (neighborhoodIds.length > 0) {
      const { data: neighborhoodAnnouncements } = await supabase
        .from("announcement_neighborhoods")
        .select("announcement_id")
        .in("neighborhood_id", neighborhoodIds)

      announcementIds = neighborhoodAnnouncements?.map((a) => a.announcement_id) || []
    }

    const now = new Date().toISOString()
    
    // Get community-wide announcements
    const communityQuery = supabase
      .from("announcements")
      .select("id, title, announcement_type, priority, description, published_at, auto_archive_date")
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .is("location_type", null) // community-wide announcements have no location restrictions
      .or(`auto_archive_date.is.null,auto_archive_date.gte.${now}`)

    const { data: communityAnnouncements } = await communityQuery

    // Get neighborhood-specific announcements if user has neighborhoods
    let neighborhoodAnnouncements: any[] = []
    if (announcementIds.length > 0) {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, announcement_type, priority, description, published_at, auto_archive_date")
        .eq("tenant_id", tenantId)
        .eq("status", "published")
        .in("id", announcementIds)
        .or(`auto_archive_date.is.null,auto_archive_date.gte.${now}`)

      neighborhoodAnnouncements = data || []
    }

    // Combine and deduplicate
    const allAnnouncements = [...(communityAnnouncements || []), ...neighborhoodAnnouncements]
    const uniqueAnnouncements = Array.from(
      new Map(allAnnouncements.map(a => [a.id, a])).values()
    )

    // Sort by priority then date
    const sortedAnnouncements = uniqueAnnouncements.sort((a, b) => {
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

    // Filter to only unread and limit to 5
    const unread = sortedAnnouncements
      .filter((a) => !readIds.has(a.id))
      .slice(0, 5)

    // Get total unread count
    const totalUnread = sortedAnnouncements.filter((a) => !readIds.has(a.id)).length

    return NextResponse.json({
      announcements: unread,
      unreadCount: totalUnread,
    })
  } catch (error) {
    console.error("[v0] Error fetching unread announcements:", error)
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 })
  }
}
