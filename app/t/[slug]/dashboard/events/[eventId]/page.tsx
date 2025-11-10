import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, Users } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CopyEventLinkButton } from "./copy-event-link-button"

const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>
}) {
  const { slug, eventId } = await params

  if (!isValidUUID(eventId)) {
    notFound()
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: resident } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  const { data: event } = await supabase
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

  if (!event) {
    notFound()
  }

  const creator = event.creator
  const creatorInitials =
    creator?.first_name && creator?.last_name ? `${creator.first_name[0]}${creator.last_name[0]}` : "?"

  const isCreator = user.id === event.created_by

  const formatDateTime = (date: string, time: string | null) => {
    if (!time) {
      return format(new Date(date), "EEEE, MMMM d, yyyy")
    }
    const dateTime = new Date(`${date}T${time}`)
    return format(dateTime, "EEEE, MMMM d, yyyy 'at' h:mm a")
  }

  const eventUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/t/${slug}/dashboard/events/${eventId}`

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href={`/t/${slug}/dashboard/events`}>← Back to Events</Link>
        </Button>
        {isCreator && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/t/${slug}/dashboard/events/${eventId}/edit`}>Edit Event</Link>
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                {event.event_categories?.icon && <span className="text-4xl">{event.event_categories.icon}</span>}
                <CardTitle className="text-3xl leading-tight">{event.title}</CardTitle>
              </div>
              <CardDescription className="text-base">{event.event_categories?.name || "Uncategorized"}</CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Badge variant={event.status === "published" ? "default" : "secondary"} className="capitalize">
                {event.status}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {event.event_type === "official" ? "Official Event" : "Resident Event"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date and Time Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Starts</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(event.start_date, event.start_time)}</p>
              </div>
            </div>

            {event.end_date && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Ends</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(event.end_date, event.end_time)}</p>
                </div>
              </div>
            )}

            {/* Visibility Scope */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Visibility</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {event.visibility_scope === "community"
                    ? "All Community Members"
                    : event.visibility_scope === "neighborhood"
                      ? "Neighborhood Only"
                      : "Private Event"}
                </p>
              </div>
            </div>

            {/* Organizer Information */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-10 w-10">
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

          {/* Description */}
          {event.description && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-lg font-semibold">About this event</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Additional Notes */}
          {event.additional_notes && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{event.additional_notes}</p>
            </div>
          )}

          {/* RSVP Information */}
          {event.requires_rsvp && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">RSVP Required</h3>
                  {event.rsvp_deadline && (
                    <p className="text-sm text-muted-foreground">
                      RSVP by {format(new Date(event.rsvp_deadline), "MMMM d, yyyy")}
                    </p>
                  )}
                  {event.max_attendees && (
                    <p className="text-sm text-muted-foreground">Maximum {event.max_attendees} attendees</p>
                  )}
                </div>
                <Button>RSVP Now</Button>
              </div>
            </div>
          )}

          {/* Share Event */}
          <div className="pt-4 border-t">
            <CopyEventLinkButton eventUrl={eventUrl} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
