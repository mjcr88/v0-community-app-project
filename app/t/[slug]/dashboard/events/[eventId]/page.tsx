import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, MapPin, User } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>
}) {
  console.log("[v0] EventDetailPage - Component invoked")

  const { slug, eventId } = await params
  console.log("[v0] EventDetailPage - params:", { slug, eventId })

  // Return null to let Next.js route to the static /new/page.tsx
  if (eventId === "new") {
    console.log("[v0] EventDetailPage - Detected static route 'new', returning null")
    return null
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const isValidUuid = uuidRegex.test(eventId)
  console.log("[v0] EventDetailPage - UUID validation:", { eventId, isValidUuid })

  if (!isValidUuid) {
    console.log("[v0] EventDetailPage - Invalid UUID, calling notFound()")
    notFound()
  }

  console.log("[v0] EventDetailPage - Creating Supabase client")
  const supabase = await createClient()

  console.log("[v0] EventDetailPage - Fetching auth user")
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] EventDetailPage - Auth user:", user?.id)

  if (!user) {
    console.log("[v0] EventDetailPage - No user, redirecting to login")
    redirect(`/t/${slug}/login`)
  }

  console.log("[v0] EventDetailPage - Fetching resident data")
  const { data: resident, error: residentError } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  console.log("[v0] EventDetailPage - Resident data:", { resident, residentError })

  if (!resident) {
    console.log("[v0] EventDetailPage - No resident, redirecting to login")
    redirect(`/t/${slug}/login`)
  }

  console.log("[v0] EventDetailPage - Fetching event data with ID:", eventId)
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      `
      *,
      event_categories (
        name,
        icon
      ),
      creator:users!created_by (
        first_name,
        last_name,
        profile_picture_url
      )
    `,
    )
    .eq("id", eventId)
    .eq("tenant_id", resident.tenant_id)
    .single()

  console.log("[v0] EventDetailPage - Event query result:", {
    eventFound: !!event,
    eventId: event?.id,
    eventTitle: event?.title,
    error: eventError,
  })

  if (!event) {
    console.log("[v0] EventDetailPage - No event found, calling notFound()")
    notFound()
  }

  console.log("[v0] EventDetailPage - Successfully loaded event, rendering page")

  const creator = event.creator
  const creatorInitials =
    creator?.first_name && creator?.last_name ? `${creator.first_name[0]}${creator.last_name[0]}` : "?"

  const formatDateTime = (date: string, time?: string) => {
    if (!time) {
      return format(new Date(date), "MMM d, yyyy")
    }
    const dateTimeStr = `${date}T${time}`
    return format(new Date(dateTimeStr), "MMM d, yyyy 'at' h:mm a")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href={`/t/${slug}/dashboard/events`}>← Back to Events</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {event.event_categories?.icon && <span className="text-3xl">{event.event_categories.icon}</span>}
                <CardTitle className="text-3xl">{event.title}</CardTitle>
              </div>
              <CardDescription className="text-base">{event.event_categories?.name || "Uncategorized"}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={event.status === "published" ? "default" : "secondary"}>{event.status}</Badge>
              <Badge variant="outline">{event.visibility_scope}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Start</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(event.start_date, event.start_time || undefined)}
                </p>
              </div>
            </div>

            {event.end_date && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">End</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(event.end_date, event.end_time || undefined)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Event Type</p>
                <p className="text-sm text-muted-foreground capitalize">{event.event_type.replace("_", " ")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={creator?.profile_picture_url || undefined} />
                  <AvatarFallback>{creatorInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {creator?.first_name} {creator?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">Organizer</p>
                </div>
              </div>
            </div>
          </div>

          {event.description && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">About this event</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
