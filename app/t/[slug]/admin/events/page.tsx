import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Calendar } from "lucide-react"
import Link from "next/link"
import { AdminEventsTable } from "./admin-events-table"

export default async function AdminEventsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect("/backoffice/login")
  }

  // Fetch all events for the tenant with necessary joins
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select(`
      *,
      event_categories:category_id (
        id,
        name,
        icon
      ),
      users:created_by (
        id,
        first_name,
        last_name,
        email
      ),
      event_images!left (
        image_url,
        is_hero
      )
    `)
    .eq("tenant_id", tenant.id)
    .order("start_date", { ascending: false })

  if (eventsError) {
    console.error("[v0] Error fetching events:", eventsError)
  }

  // Fetch RSVP counts for all events
  const { data: rsvpData } = await supabase
    .from("event_rsvps")
    .select("event_id, attending_count")
    .in("event_id", events?.map((e) => e.id) || [])
    .eq("rsvp_status", "going")

  // Fetch flag counts for all events
  const { data: flagData } = await supabase
    .from("event_flags")
    .select("event_id")
    .in("event_id", events?.map((e) => e.id) || [])

  // Calculate RSVP totals per event
  const rsvpCounts = rsvpData?.reduce(
    (acc, rsvp) => {
      if (!acc[rsvp.event_id]) acc[rsvp.event_id] = 0
      acc[rsvp.event_id] += rsvp.attending_count || 0
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate flag counts per event
  const flagCounts = flagData?.reduce(
    (acc, flag) => {
      if (!acc[flag.event_id]) acc[flag.event_id] = 0
      acc[flag.event_id] += 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Enrich events with counts and hero image
  const enrichedEvents = events?.map((event) => ({
    ...event,
    rsvp_count: rsvpCounts?.[event.id] || 0,
    flag_count: flagCounts?.[event.id] || 0,
    hero_image: event.event_images?.find((img: any) => img.is_hero)?.image_url || null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Events</h2>
          <p className="text-muted-foreground">Manage all events in your community</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/t/${slug}/admin/events/categories`}>
              <Calendar className="mr-2 h-4 w-4" />
              Categories
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/t/${slug}/dashboard/events/create`}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </div>
      </div>

      {!enrichedEvents || enrichedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Get started by creating your first event</p>
          <Button asChild>
            <Link href={`/t/${slug}/dashboard/events/create`}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </div>
      ) : (
        <AdminEventsTable events={enrichedEvents} slug={slug} />
      )}
    </div>
  )
}
