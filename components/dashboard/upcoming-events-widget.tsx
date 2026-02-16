"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Heart, Check, HelpCircle, X, Flag, Loader2 } from 'lucide-react'
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { useState } from "react"
import { rsvpToEvent, saveEvent, unsaveEvent } from "@/app/actions/events"
import { useRouter } from 'next/navigation'
import { LocationBadge } from "@/components/events/location-badge"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { EventRsvpQuickAction } from "@/components/event-rsvp-quick-action"
import { RioEmptyState } from "./rio-empty-state"

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
  flag_count?: number
  status?: "draft" | "published" | "cancelled"
  parent_event_id?: string | null
  is_series?: boolean
}

interface UpcomingEventsWidgetProps {
  slug: string
  userId: string
  tenantId: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function UpcomingEventsWidget({ slug, userId, tenantId }: UpcomingEventsWidgetProps) {
  const router = useRouter()
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const { data: events, error, isLoading, mutate } = useSWR<Event[]>(
    `/api/events/upcoming/${tenantId}?limit=5`,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      errorRetryCount: 0,
      onError: (err) => {
        console.log("[v0] Events widget fetch error (non-critical):", err.message)
      },
    }
  )

  const handleRsvp = async (eventId: string, status: "yes" | "maybe" | "no", e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId || !tenantId) return

    setLoadingStates((prev) => ({ ...prev, [eventId]: true }))

    const result = await rsvpToEvent(eventId, tenantId, status)

    setLoadingStates((prev) => ({ ...prev, [eventId]: false }))

    if (result.success) {
      mutate()
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
      mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Failed to load events. Please refresh the page.
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <RioEmptyState
        title="No upcoming events"
        message="Get the community together! Create an event or browse what's happening."
        action={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/t/${slug}/dashboard/events`}>Browse</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/t/${slug}/dashboard/events/create`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </Button>
          </>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile: Stack title/badge and buttons | Desktop: Single row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Upcoming Events</h3>
          <Badge variant="secondary" className="bg-secondary/10 text-secondary border-none hover:bg-secondary/20">
            {events.length} Next
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground flex-1 md:flex-none">
            <Link href={`/t/${slug}/dashboard/events`}>View All</Link>
          </Button>
          <Button asChild size="sm" className="flex-1 md:flex-none">
            <Link href={`/t/${slug}/dashboard/events/create`}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Create Event</span>
              <span className="sm:hidden">Create</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {events.map((event) => {
          const startDate = parseISO(event.start_date)
          const startTime = event.start_time ? format(parseISO(`2000-01-01T${event.start_time}`), "h:mm a") : null
          const isSaved = event.is_saved || false
          const userRsvpStatus = event.user_rsvp_status as "yes" | "maybe" | "no" | null
          const isCancelled = event.status === "cancelled"

          return (
            <Link key={event.id} href={`/t/${slug}/dashboard/events/${event.id}`}>
              <div
                className={`group flex gap-4 p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200 ${isCancelled ? "opacity-60" : ""}`}
              >
                {/* Date box - narrower on mobile */}
                <div className="flex flex-col items-center justify-center bg-primary/5 rounded-lg px-2 md:px-4 py-2 min-w-[3.5rem] md:min-w-[4.5rem] flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  <div className="text-xs font-semibold text-primary/80 uppercase tracking-wide">{format(startDate, "MMM")}</div>
                  <div className="text-2xl font-bold text-primary leading-none mt-0.5">{format(startDate, "d")}</div>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">{event.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{event.is_all_day ? "All day" : startTime || "Time TBD"}</span>
                      <span>•</span>
                      <span>{event.event_categories?.name || "Event"}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {isCancelled && (
                        <Badge variant="destructive" className="text-xs">Cancelled</Badge>
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

                    {/* RSVP Actions */}
                    <div className="pt-2">
                      <EventRsvpQuickAction
                        eventId={event.id}
                        tenantId={tenantId}
                        userId={userId}
                        currentRsvpStatus={userRsvpStatus}
                        isSaved={isSaved}
                        requiresRsvp={event.requires_rsvp}
                        maxAttendees={event.max_attendees}
                        currentAttendeeCount={event.attending_count}
                        rsvpDeadline={event.rsvp_deadline}
                        isSeries={event.is_series}
                        parentEventId={event.parent_event_id}
                        startDate={event.start_date}
                      />
                    </div>
                  </div>

                  {/* Icon & Save */}
                  <div className="flex flex-col items-end justify-between gap-2">
                    {event.event_categories?.icon && (
                      <span className="text-2xl opacity-80" aria-label={event.event_categories.name}>
                        {event.event_categories.icon}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
