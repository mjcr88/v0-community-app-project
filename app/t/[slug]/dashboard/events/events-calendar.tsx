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
import { RioImage } from "@/components/library/rio-image"
import Image from "next/image"

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
  status?: "draft" | "published" | "cancelled"
}

import { RioEmptyState } from "@/components/exchange/rio-empty-state"

// ... (keep existing imports)

export function EventsCalendar({
  events,
  slug,
  hasActiveFilters,
  userId,
  tenantId,
  emptyStateVariant = "no-upcoming",
}: {
  events: Event[]
  slug: string
  hasActiveFilters: boolean
  userId: string
  tenantId: string
  emptyStateVariant?: "no-matches" | "no-upcoming" | "no-past" | "no-rsvp" | "no-listings"
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

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date && window.innerWidth < 1024) {
      setTimeout(() => {
        const resultsElement = document.getElementById("calendar-results")
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 100)
    }
  }

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
            onSelect={handleDateSelect}
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

      <Card id="calendar-results">
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
                const isCancelled = event.status === "cancelled"

                return (
                  <Card key={event.id} className={`hover:shadow-md transition-all ${isCancelled ? "opacity-60" : ""}`}>
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
                          {isCancelled && (
                            <Badge variant="destructive" className="text-xs">
                              Cancelled
                            </Badge>
                          )}
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
            <RioEmptyState
              variant="no-upcoming"
              title="No events scheduled"
              description="There are no events scheduled for this date. Why not create one?"
              action={
                <Link href={`/t/${slug}/dashboard/events/create`}>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Event
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
              <div className="relative w-64 h-64 hidden lg:block">
                <Image
                  src="/rio/rio_pointing_calendar.png"
                  alt="Rio pointing to calendar"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="relative w-48 h-48 lg:hidden">
                <Image
                  src="/rio/rio_pointing_up.png"
                  alt="Rio pointing up"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <p className="text-muted-foreground font-medium">Select a date on the calendar to view events</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  )
}
