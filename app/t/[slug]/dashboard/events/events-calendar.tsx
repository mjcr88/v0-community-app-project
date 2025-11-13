"use client"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarClock, Plus, Lock, Building, Flag } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { useState } from "react"
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
  tenant_id: string
  requires_rsvp: boolean
  max_attendees: number
  attending_count: number
  rsvp_deadline: string
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

export function EventsCalendar({
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const hasEvents = events.length > 0

  const eventDates = new Set<string>()
  const eventsByDate = new Map<string, Event[]>()

  events.forEach((event) => {
    const startDate = parseISO(event.start_date)
    const dateKey = format(startDate, "yyyy-MM-dd")
    eventDates.add(dateKey)

    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, [])
    }
    eventsByDate.get(dateKey)!.push(event)
  })

  const selectedEvents = selectedDate ? eventsByDate.get(format(selectedDate, "yyyy-MM-dd")) || [] : []

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
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <Card>
        <CardHeader>
          <CardTitle>Event Calendar</CardTitle>
          <CardDescription>Click on a date to see events scheduled for that day</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{
              hasEvent: (date) => eventDates.has(format(date, "yyyy-MM-dd")),
            }}
            modifiersClassNames={{
              hasEvent:
                "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full",
            }}
            className="rounded-md border w-full max-w-full"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a Date"}</CardTitle>
          <CardDescription>
            {selectedDate
              ? `${selectedEvents.length} event${selectedEvents.length !== 1 ? "s" : ""} on this day`
              : "Click a date on the calendar to see events"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDate && selectedEvents.length > 0 ? (
            <div className="space-y-4">
              {selectedEvents.map((event) => {
                const startTime = event.start_time ? format(parseISO(`2000-01-01T${event.start_time}`), "h:mm a") : null
                const endTime = event.end_time ? format(parseISO(`2000-01-01T${event.end_time}`), "h:mm a") : null

                return (
                  <Card key={event.id} className="hover:shadow-md transition-all">
                    <Link href={`/t/${slug}/dashboard/events/${event.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base line-clamp-2">{event.title}</CardTitle>
                          {event.event_categories?.icon && (
                            <span className="text-xl flex-shrink-0">{event.event_categories.icon}</span>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {event.event_categories?.name || "Uncategorized"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {!event.is_all_day && startTime && (
                          <div className="text-sm font-medium">
                            {startTime}
                            {endTime && ` - ${endTime}`}
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
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
                          {event.flag_count !== undefined && event.flag_count > 0 && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <Flag className="h-3 w-3" />
                              {event.flag_count}
                            </Badge>
                          )}
                          <LocationBadge
                            locationType={event.location_type || null}
                            locationName={event.location?.name}
                            customLocationName={event.custom_location_name}
                            compact
                          />
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
          ) : selectedDate ? (
            <p className="text-sm text-muted-foreground text-center py-8">No events scheduled for this date</p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Select a date to view events</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
