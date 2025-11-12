"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Heart, Check, HelpCircle, X } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { useState } from "react"
import { rsvpToEvent, saveEvent, unsaveEvent } from "@/app/actions/events"
import { useRouter } from "next/navigation"
import { LocationBadge } from "@/components/events/location-badge"

interface Event {
  id: string
  title: string
  description: string | null
  start_date: string
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
  event_categories: {
    name: string
    icon: string
  } | null
  tenant_id: string
  requires_rsvp?: boolean
  max_attendees?: number | null
  attending_count?: number
  rsvp_deadline?: string | null
  user_rsvp_status?: string | null
  is_saved?: boolean
  location_type?: "community_location" | "custom_temporary" | null
  location?: {
    id: string
    name: string
  } | null
  custom_location_name?: string | null
}

export function UpcomingEventsWidget({
  events,
  slug,
  userId,
  tenantId,
}: {
  events: Event[]
  slug: string
  userId?: string
  tenantId?: string
}) {
  const router = useRouter()
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const handleRsvp = async (eventId: string, status: "yes" | "maybe" | "no", e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId || !tenantId) return

    setLoadingStates((prev) => ({ ...prev, [eventId]: true }))

    const result = await rsvpToEvent(eventId, tenantId, status)

    setLoadingStates((prev) => ({ ...prev, [eventId]: false }))

    if (result.success) {
      router.refresh()
    }
  }

  const handleSave = async (eventId: string, currentlySaved: boolean, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId || !tenantId) return

    setLoadingStates((prev) => ({ ...prev, [`save-${eventId}`]: true }))

    const result = currentlySaved ? await unsaveEvent(eventId, tenantId) : await saveEvent(eventId, tenantId)

    setLoadingStates((prev) => ({ ...prev, [`save-${eventId}`]: false }))

    if (result.success) {
      router.refresh()
    }
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>No upcoming events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No upcoming events. RSVP or save events to see them here!
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button asChild variant="outline">
                <Link href={`/t/${slug}/dashboard/events`}>Browse Events</Link>
              </Button>
              <Button asChild>
                <Link href={`/t/${slug}/dashboard/events/create`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>
            Your next {events.length} event{events.length === 1 ? "" : "s"}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/t/${slug}/dashboard/events`}>View All</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/t/${slug}/dashboard/events/create`}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => {
            const startDate = parseISO(event.start_date)
            const startTime = event.start_time ? format(parseISO(`2000-01-01T${event.start_time}`), "h:mm a") : null
            const isSaved = event.is_saved || false
            const userRsvpStatus = event.user_rsvp_status as "yes" | "maybe" | "no" | null

            return (
              <Link key={event.id} href={`/t/${slug}/dashboard/events/${event.id}`}>
                <div className="flex gap-4 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  {/* Date box on left */}
                  <div className="flex flex-col items-center justify-center bg-primary/10 rounded-md px-3 py-2 min-w-[4rem] flex-shrink-0">
                    <div className="text-xs font-medium text-primary uppercase">{format(startDate, "MMM")}</div>
                    <div className="text-2xl font-bold text-primary leading-none">{format(startDate, "d")}</div>
                  </div>

                  {/* Main content area - multi-column layout */}
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    {/* Left column: Event details */}
                    <div className="space-y-1">
                      <h4 className="font-semibold text-base leading-tight">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {event.is_all_day ? "All day" : startTime || "Time TBD"}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-muted-foreground">{event.event_categories?.name || "Event"}</p>
                        <LocationBadge
                          locationType={event.location_type || null}
                          locationName={event.location?.name}
                          customLocationName={event.custom_location_name}
                          compact
                        />
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{event.description}</p>
                      )}

                      {/* RSVP quick actions for RSVP events */}
                      {userId && tenantId && event.requires_rsvp && (
                        <div className="flex items-center gap-1 pt-2" onClick={(e) => e.preventDefault()}>
                          <Button
                            size="sm"
                            variant={userRsvpStatus === "yes" ? "default" : "outline"}
                            className="h-7 px-2"
                            onClick={(e) => handleRsvp(event.id, "yes", e)}
                            disabled={loadingStates[event.id]}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant={userRsvpStatus === "maybe" ? "default" : "outline"}
                            className="h-7 px-2"
                            onClick={(e) => handleRsvp(event.id, "maybe", e)}
                            disabled={loadingStates[event.id]}
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant={userRsvpStatus === "no" ? "default" : "outline"}
                            className="h-7 px-2"
                            onClick={(e) => handleRsvp(event.id, "no", e)}
                            disabled={loadingStates[event.id]}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          {event.max_attendees && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {event.attending_count}/{event.max_attendees} spots
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right column: Icon and save button */}
                    <div className="flex flex-col items-center justify-start gap-2 flex-shrink-0">
                      {event.event_categories?.icon && (
                        <span className="text-3xl" aria-label={event.event_categories.name}>
                          {event.event_categories.icon}
                        </span>
                      )}
                      {userId && tenantId && (
                        <Button
                          size="sm"
                          variant={isSaved ? "default" : "ghost"}
                          className="h-8 w-8 p-0"
                          onClick={(e) => handleSave(event.id, isSaved, e)}
                          disabled={loadingStates[`save-${event.id}`]}
                        >
                          <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
