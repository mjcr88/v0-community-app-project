import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization")
    
    // In production, check for Vercel Cron secret
    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    console.log("[v0] Auto-archive cron job started at", new Date().toISOString())

    const supabase = await createClient()
    const now = new Date().toISOString()

    // Find all published announcements that have passed their auto_archive_date
    const { data: expiredAnnouncements, error: fetchError } = await supabase
      .from("announcements")
      .select("id, title, tenant_id, auto_archive_date")
      .eq("status", "published")
      .not("auto_archive_date", "is", null)
      .lte("auto_archive_date", now)

    if (fetchError) {
      console.error("[v0] Error fetching expired announcements:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch announcements", details: fetchError.message },
        { status: 500 }
      )
    }

    if (!expiredAnnouncements || expiredAnnouncements.length === 0) {
      console.log("[v0] No expired announcements found")
      return NextResponse.json({
        success: true,
        message: "No announcements to archive",
        archived: 0,
      })
    }

    console.log(
      `[v0] Found ${expiredAnnouncements.length} expired announcements to archive:`,
      expiredAnnouncements.map((a) => ({ id: a.id, title: a.title }))
    )

    // Archive all expired announcements
    const { data: archived, error: updateError } = await supabase
      .from("announcements")
      .update({
        status: "archived",
        archived_at: now,
        updated_at: now,
      })
      .in(
        "id",
        expiredAnnouncements.map((a) => a.id)
      )
      .select("id, title, tenant_id")

    if (updateError) {
      console.error("[v0] Error archiving announcements:", updateError)
      return NextResponse.json(
        { error: "Failed to archive announcements", details: updateError.message },
        { status: 500 }
      )
    }

    console.log(`[v0] Successfully archived ${archived?.length || 0} announcements`)

    // Return summary
    return NextResponse.json({
      success: true,
      message: `Archived ${archived?.length || 0} expired announcements`,
      archived: archived?.length || 0,
      announcements: archived?.map((a) => ({
        id: a.id,
        title: a.title,
        tenant_id: a.tenant_id,
      })),
      timestamp: now,
    })
  } catch (error) {
    console.error("[v0] Unexpected error in auto-archive cron:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}
