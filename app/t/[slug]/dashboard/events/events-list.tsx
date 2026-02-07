import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, CalendarClock, Lock, Building, Flag, Users } from "lucide-react"
import Link from "next/link"
import { format, isPast, parseISO } from "date-fns"
import { EventRsvpQuickAction } from "@/components/event-rsvp-quick-action"
import { LocationBadge } from "@/components/events/location-badge"
import { RioImage } from "@/components/library/rio-image"
import { PulsatingButton } from "@/components/library/pulsating-button"
import { EnhancedEventCard } from "@/components/events/enhanced-event-card"
import { FriendsGoingBadge } from "@/components/events/friends-going-badge"
import { RioEmptyState } from "@/components/exchange/rio-empty-state"

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
  event_neighborhoods?: {
    id: string
    neighborhoods: {
      name: string
    } | null
  }[]
  location_type?: "community_location" | "custom_temporary" | null
  location?: {
    id: string
    name: string
  } | null
  custom_location_name?: string | null
  flag_count?: number
  status?: "draft" | "published" | "cancelled"
  attendee_ids?: string[]
  parent_event_id?: string | null
  recurrence_rule?: any | null
}

export function EventsList({
  events,
  slug,
  hasActiveFilters,
  userId,
  tenantId,
  emptyStateVariant = "no-upcoming",
  friendIds = [],
}: {
  events: Event[]
  slug: string
  hasActiveFilters: boolean
  userId: string
  tenantId: string
  emptyStateVariant?: "no-matches" | "no-upcoming" | "no-past" | "no-rsvp" | "no-listings"
  friendIds?: string[]
}) {
  const hasEvents = events.length > 0

  if (!hasEvents) {
    return (
      <RioEmptyState
        variant={emptyStateVariant}
        title={
          emptyStateVariant === "no-matches"
            ? "No events match your filters"
            : emptyStateVariant === "no-past"
              ? "No past events"
              : "No upcoming events"
        }
        description={
          emptyStateVariant === "no-matches"
            ? "Try adjusting your filters to see more events."
            : emptyStateVariant === "no-past"
              ? "You haven't attended any events yet."
              : "Be the first to create an event and bring your community together!"
        }
        action={
          emptyStateVariant !== "no-past" ? (
            <Link href={`/t/${slug}/dashboard/events/create`}>
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </Link>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        const startDate = parseISO(event.start_date)
        const endDate = event.end_date ? parseISO(event.end_date) : null
        const isMultiDay = endDate && endDate.toDateString() !== startDate.toDateString()
        const eventIsPast = isPast(endDate || startDate)
        const isCancelled = event.status === "cancelled"

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

        // Check if event is upcoming within 48 hours for priority styling
        const now = new Date()
        const hoursDiff = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)
        const isPriority = !eventIsPast && hoursDiff > 0 && hoursDiff <= 48

        return (
          <EnhancedEventCard
            key={event.id}
            eventDate={event.start_date}
            isPriority={isPriority}
            isCancelled={isCancelled}
          >
            <div className="flex flex-col h-full">
              <Link href={`/t/${slug}/dashboard/events/${event.id}`} className="flex-1 block">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-balance">{event.title}</CardTitle>
                    {event.event_categories?.icon && (
                      <span className="text-2xl flex-shrink-0 transition-transform hover:scale-110">
                        {event.event_categories.icon}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardDescription className="line-clamp-1">
                      {event.event_categories?.name || "Uncategorized"}
                    </CardDescription>
                    {isCancelled && (
                      <Badge variant="destructive" className="text-xs badge-enter">
                        Cancelled
                      </Badge>
                    )}
                    {eventIsPast && !isCancelled && (
                      <Badge variant="outline" className="text-xs badge-enter">
                        Past Event
                      </Badge>
                    )}
                    {event.flag_count !== undefined && event.flag_count > 0 && (
                      <Badge variant="destructive" className="text-xs gap-1 badge-enter">
                        <Flag className="h-3 w-3" />
                        {event.flag_count}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="line-clamp-1">{displayDate}</span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 text-pretty">{event.description.replace(/(<([^>]+)>)/gi, '').trim()}</p>
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
                    {event.visibility_scope === "neighborhood" && event.event_neighborhoods && event.event_neighborhoods.length > 0 && (
                      <>
                        {event.event_neighborhoods.map((en: any) => (
                          <Badge key={en.id} variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {en.neighborhoods?.name || "Neighborhood"}
                          </Badge>
                        ))}
                      </>
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
                    {friendIds && friendIds.length > 0 && event.attendee_ids && event.attendee_ids.length > 0 && (
                      <FriendsGoingBadge
                        attendeeIds={event.attendee_ids}
                        friendIds={friendIds}
                      />
                    )}
                  </div>
                </CardContent>
              </Link>

              <div className="p-6 pt-0 mt-auto">
                <div className="flex items-center justify-between gap-3 border-t pt-4 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0 flex-shrink">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={event.creator?.profile_picture_url || undefined} alt={creatorName} />
                      <AvatarFallback className="text-xs">{creatorInitials}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate">Organized by {creatorName}</span>
                  </div>
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
                    isSeries={!!event.parent_event_id || !!event.recurrence_rule}
                    parentEventId={event.parent_event_id}
                    startDate={event.start_date}
                  />
                </div>
              </div>
            </div>
          </EnhancedEventCard>
        )
      })}
    </div>
  )
}
