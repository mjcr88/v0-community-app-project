import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default async function EventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: resident } = await supabase
    .from("users")
    .select("id, tenant_id, lot_id, lots(neighborhoods(id))")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  // Fetch events visible to this user (community-wide only for Sprint 3)
  const { data: events } = await supabase
    .from("events")
    .select(
      `
      *,
      event_categories (
        name,
        icon
      ),
      users (
        first_name,
        last_name,
        profile_picture_url
      )
    `,
    )
    .eq("tenant_id", resident.tenant_id)
    .eq("visibility_scope", "community")
    .eq("status", "published")
    .order("start_datetime", { ascending: true })

  const hasEvents = events && events.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Events</h2>
          <p className="text-muted-foreground">Discover and join community events</p>
        </div>
        <Button asChild>
          <Link href={`/t/${slug}/dashboard/events/create`}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      {!hasEvents ? (
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle>No events yet</CardTitle>
            <CardDescription>Be the first to create an event for your community!</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href={`/t/${slug}/dashboard/events/create`}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link key={event.id} href={`/t/${slug}/dashboard/events/${event.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                    {event.event_categories?.icon && (
                      <span className="text-2xl ml-2">{event.event_categories.icon}</span>
                    )}
                  </div>
                  <CardDescription className="line-clamp-1">
                    {event.event_categories?.name || "Uncategorized"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(event.start_datetime), "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{event.event_type}</Badge>
                    <Badge variant="outline">{event.visibility_scope}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
