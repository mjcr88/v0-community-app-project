import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
  try {
    const { tenantId } = await context.params
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let query = supabase
      .from("notifications")
      .select(`
        *,
        actor:users!actor_id(id, first_name, last_name, profile_picture_url),
        exchange_listing:exchange_listings!exchange_listing_id(
          id, 
          title, 
          hero_photo,
          category:exchange_categories(id, name)
        ),
        exchange_transaction:exchange_transactions!exchange_transaction_id(
          id,
          quantity,
          proposed_pickup_date,
          proposed_return_date,
          proposed_return_date,
          borrower_message,
          lender_message,
          status,
          lender_id,
          borrower_id,
          expected_return_date,
          actual_return_date,
          return_condition
        ),
        event:events!event_id(
          id,
          title,
          start_date,
          start_time,
          end_date,
          end_time,
          is_all_day,
          location_id,
          custom_location_name
        ),
        check_in:check_ins!check_in_id(
          id,
          title,
          activity_type,
          start_time,
          duration_minutes,
          location_id,
          custom_location_name
        )
      `)
      .eq("tenant_id", tenantId)
      .eq("recipient_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error("[v0] Error fetching notifications:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    return NextResponse.json(notifications || [])
  } catch (error) {
    console.error("[v0] Error in notifications API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
