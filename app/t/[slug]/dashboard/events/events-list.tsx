import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, CalendarClock, Lock, Building, Flag } from "lucide-react"
import Link from "next/link"
import { format, isPast, parseISO } from "date-fns"
import { EventRsvpQuickAction } from "@/components/event-rsvp-quick-action"
import { LocationBadge } from "@/components/events/location-badge"

interface Event {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
  event_type: string
  event_categories: {
    name: string
    icon: string
  } | null
  creator: {
    first_name: string
    last_name: string
    profile_picture_url: string | null
  } | null
  tenant_id: string
  requires_rsvp: boolean | null
  max_attendees: number | null
  attending_count: number | null
  rsvp_deadline: string | null
  user_rsvp_status?: string | null
  is_saved?: boolean
  visibility_scope?: string | null
  location_type?: "community_location" | "custom_temporary" | null
  location?: {
    id: string
    name: string
  } | null
  custom_location_name?: string | null
  flag_count?: number
}

export function EventsList({
  events,
  slug,
  hasActiveFilters,
  userId,
  tenantId,
}: {
  events: Event[]
  slug: string
  hasActiveFilters: boolean
  userId: string
  tenantId: string
}) {
  const hasEvents = events.length > 0

  if (!hasEvents) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <CalendarClock className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {hasActiveFilters ? "No events match your filters" : "No events yet"}
          </CardTitle>
          <CardDescription className="text-base">
            {hasActiveFilters
              ? "Try adjusting your filters to see more events"
              : "Be the first to create an event and bring your community together!"}
          </CardDescription>
        </CardHeader>
        {!hasActiveFilters && (
          <CardContent className="flex justify-center pb-8">
            <Button asChild size="lg">
              <Link href={`/t/${slug}/dashboard/events/create`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Link>
            </Button>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        const startDate = parseISO(event.start_date)
        const endDate = event.end_date ? parseISO(event.end_date) : null
        const isMultiDay = endDate && endDate.toDateString() !== startDate.toDateString()
        const eventIsPast = isPast(endDate || startDate)

        let displayDate: string
        if (event.is_all_day) {
          if (isMultiDay) {
            displayDate = `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
          } else {
            displayDate = format(startDate, "MMM d, yyyy")
          }
        } else {
          const startTime = event.start_time ? format(parseISO(`2000-01-01T${event.start_time}`), "h:mm a") : ""
          const endTime = event.end_time ? format(parseISO(`2000-01-01T${event.end_time}`), "h:mm a") : ""

          if (isMultiDay) {
            displayDate = `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
          } else {
            displayDate = format(startDate, "MMM d, yyyy")
            if (startTime) {
              displayDate += ` at ${startTime}`
              if (endTime) {
                displayDate += ` - ${endTime}`
              }
            }
          }
        }

        const creatorName =
          event.creator?.first_name && event.creator?.last_name
            ? `${event.creator.first_name} ${event.creator.last_name}`
            : "Unknown"
        const creatorInitials =
          event.creator?.first_name && event.creator?.last_name
            ? `${event.creator.first_name[0]}${event.creator.last_name[0]}`.toUpperCase()
            : "?"

        return (
          <Card
            key={event.id}
            className={`hover:shadow-lg transition-all cursor-pointer h-full ${
              eventIsPast ? "opacity-60 hover:opacity-80" : ""
            } ${event.flag_count !== undefined && event.flag_count > 0 ? "border-destructive/50 border-2" : ""}`}
          >
            <Link href={`/t/${slug}/dashboard/events/${event.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-balance">{event.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {event.flag_count !== undefined && event.flag_count > 0 && (
                      <Badge variant="destructive" className="text-xs gap-1 flex-shrink-0">
                        <Flag className="h-3 w-3" />
                        {event.flag_count}
                      </Badge>
                    )}
                    {event.event_categories?.icon && (
                      <span className="text-2xl flex-shrink-0">{event.event_categories.icon}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardDescription className="line-clamp-1">
                    {event.event_categories?.name || "Uncategorized"}
                  </CardDescription>
                  {eventIsPast && (
                    <Badge variant="outline" className="text-xs">
                      Past Event
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="line-clamp-1">{displayDate}</span>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 text-pretty">{event.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="capitalize">
                    {event.event_type === "resident" ? "Resident" : "Official"}
                  </Badge>
                  {event.is_all_day && (
                    <Badge variant="outline" className="text-xs">
                      All Day
                    </Badge>
                  )}
                  {event.visibility_scope === "neighborhood" && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Building className="h-3 w-3" />
                      Neighborhood
                    </Badge>
                  )}
                  {event.visibility_scope === "private" && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Lock className="h-3 w-3" />
                      Private
                    </Badge>
                  )}
                  <LocationBadge
                    locationType={event.location_type || null}
                    locationName={event.location?.name}
                    customLocationName={event.custom_location_name}
                  />
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={event.creator?.profile_picture_url || undefined} alt={creatorName} />
                    <AvatarFallback className="text-xs">{creatorInitials}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground line-clamp-1">Organized by {creatorName}</span>
                </div>
              </CardContent>
            </Link>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between pt-3 border-t">
                <EventRsvpQuickAction
                  eventId={event.id}
                  tenantId={tenantId}
                  userId={userId}
                  currentRsvpStatus={event.user_rsvp_status as "yes" | "maybe" | "no" | null}
                  isSaved={event.is_saved || false}
                  requiresRsvp={event.requires_rsvp || false}
                  maxAttendees={event.max_attendees}
                  currentAttendeeCount={event.attending_count || 0}
                  rsvpDeadline={event.rsvp_deadline}
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
