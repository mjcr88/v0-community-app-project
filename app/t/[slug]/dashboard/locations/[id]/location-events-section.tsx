"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, List, Plus } from "lucide-react"
import Link from "next/link"
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
  slug,
  userId,
  tenantId,
  locationName,
  locationId,
  canCreateEvents,
}: {
  events: Event[]
  slug: string
  userId: string
  tenantId: string
  locationName: string
  locationId: string
  canCreateEvents: boolean
}) {
  const [view, setView] = useState<"list" | "calendar">("list")

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Events happening at {locationName}</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">No upcoming events at {locationName}</h3>
          <p className="text-sm text-muted-foreground mb-6">Be the first to organize an event at this location!</p>
          {canCreateEvents && (
            <Button asChild>
              <Link href={`/t/${slug}/dashboard/events/create?locationId=${locationId}`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event Here
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upcoming Events ({events.length})</CardTitle>
            <CardDescription>Events happening at {locationName}</CardDescription>
          </div>
          {canCreateEvents && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/t/${slug}/dashboard/events/create?locationId=${locationId}`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")} className="w-full">
          <TabsList className="grid w-full max-w-[300px] grid-cols-2 mb-6">
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-0">
            <EventsList events={events} slug={slug} hasActiveFilters={false} userId={userId} tenantId={tenantId} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <EventsCalendar events={events} slug={slug} hasActiveFilters={false} userId={userId} tenantId={tenantId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
