"use client"

import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, List, Plus, ChevronDown } from 'lucide-react'
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
  visibility_scope?: string
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
  const [isOpen, setIsOpen] = useState(events.length > 0)

  if (events.length === 0) {
    return null
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Calendar className="h-5 w-5 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">
                    Upcoming Events ({events.length})
                  </CardTitle>
                  <CardDescription className="mt-1">Events happening at {locationName}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                {canCreateEvents && (
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={`/t/${slug}/dashboard/events/create?locationId=${locationId}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Link>
                  </Button>
                )}
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
