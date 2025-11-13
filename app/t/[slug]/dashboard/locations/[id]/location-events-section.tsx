"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { List, CalendarIcon, Plus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { EventsList } from "@/app/t/[slug]/dashboard/events/events-list"
import { EventsCalendar } from "@/app/t/[slug]/dashboard/events/events-calendar"

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
  status?: "draft" | "published" | "cancelled"
}

export function LocationEventsSection({
  events,
  tenantSlug,
  locationName,
  locationId,
  userId,
  tenantId,
}: {
  events: Event[]
  tenantSlug: string
  locationName: string
  locationId: string
  userId: string
  tenantId: string
}) {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")

  const eventCount = events.length

  if (eventCount === 0) {
    return (
      <Card id="events" className="scroll-mt-20">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-4">
              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground mb-4">No upcoming events at {locationName}</p>
          <Button asChild>
            <Link href={`/t/${tenantSlug}/dashboard/events/create?locationId=${locationId}`}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event Here
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id="events" className="scroll-mt-20">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle>Upcoming Events</CardTitle>
            <Badge variant="secondary">{eventCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list" className="gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "list" ? (
          <EventsList events={events} slug={tenantSlug} hasActiveFilters={false} userId={userId} tenantId={tenantId} />
        ) : (
          <EventsCalendar
            events={events}
            slug={tenantSlug}
            hasActiveFilters={false}
            userId={userId}
            tenantId={tenantId}
          />
        )}
      </CardContent>
    </Card>
  )
}
