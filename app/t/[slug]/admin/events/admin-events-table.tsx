"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil, Eye, ArrowUpDown, Flag, Users, MapPin, Search } from "lucide-react"
import Link from "next/link"
import { formatDate } from "date-fns"

type AdminEvent = {
  id: string
  title: string
  description: string | null
  start_date: string
  start_time: string | null
  end_date: string | null
  end_time: string | null
  event_type: string
  visibility_scope: string
  status: string
  location_type: string
  custom_location_name: string | null
  max_attendees: number | null
  requires_rsvp: boolean
  created_at: string
  event_categories: {
    id: string
    name: string
    icon: string | null
  } | null
  users: {
    id: string
    first_name: string
    last_name: string
    email: string
  } | null
  rsvp_count: number
  flag_count: number
  hero_image: string | null
}

export function AdminEventsTable({ events, slug }: { events: AdminEvent[]; slug: string }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortedEvents, setSortedEvents] = useState<AdminEvent[]>(events)
  const [sortField, setSortField] = useState<string>("start_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events

    const query = searchQuery.toLowerCase()
    return events.filter((event) => {
      if (event.title.toLowerCase().includes(query)) return true
      if (event.description?.toLowerCase().includes(query)) return true
      if (event.event_categories?.name.toLowerCase().includes(query)) return true
      if (event.users) {
        const creatorName = `${event.users.first_name} ${event.users.last_name}`.toLowerCase()
        if (creatorName.includes(query)) return true
      }
      if (event.event_type.toLowerCase().includes(query)) return true
      if (event.visibility_scope.toLowerCase().includes(query)) return true
      if (event.status.toLowerCase().includes(query)) return true
      if (event.custom_location_name?.toLowerCase().includes(query)) return true
      return false
    })
  }, [events, searchQuery])

  useEffect(() => {
    setSortedEvents(filteredEvents)
  }, [filteredEvents])

  const handleSort = (field: string) => {
    const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(direction)

    const sorted = [...filteredEvents].sort((a, b) => {
      let aVal: any = a[field as keyof AdminEvent]
      let bVal: any = b[field as keyof AdminEvent]

      if (field === "category") {
        aVal = a.event_categories?.name?.toLowerCase() || ""
        bVal = b.event_categories?.name?.toLowerCase() || ""
      } else if (field === "creator") {
        aVal = `${a.users?.last_name} ${a.users?.first_name}`.toLowerCase()
        bVal = `${b.users?.last_name} ${b.users?.first_name}`.toLowerCase()
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase()
      }

      if (typeof bVal === "string") {
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1
      if (aVal > bVal) return direction === "asc" ? 1 : -1
      return 0
    })

    setSortedEvents(sorted)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvents(sortedEvents.map((e) => e.id))
    } else {
      setSelectedEvents([])
    }
  }

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    if (checked) {
      setSelectedEvents([...selectedEvents, eventId])
    } else {
      setSelectedEvents(selectedEvents.filter((id) => id !== eventId))
    }
  }

  const getEventDate = (event: AdminEvent) => {
    try {
      const date = new Date(event.start_date)
      return formatDate(date, "MMM d, yyyy")
    } catch {
      return event.start_date
    }
  }

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      community: "Community",
      virtual: "Virtual",
      hybrid: "Hybrid",
    }
    return labels[type] || type
  }

  const getVisibilityLabel = (scope: string) => {
    const labels: Record<string, string> = {
      community: "Community",
      neighborhood: "Neighborhood",
      private: "Private",
    }
    return labels[scope] || scope
  }

  const isPastEvent = (event: AdminEvent) => {
    const eventDate = new Date(event.start_date)
    return eventDate < new Date()
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by title, description, category, creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            {filteredEvents.length} of {events.length} event{events.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {selectedEvents.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedEvents.length} event{selectedEvents.length > 1 ? "s" : ""} selected
          </span>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedEvents.length === sortedEvents.length && sortedEvents.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("title")} className="-ml-3">
                  Title
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("creator")} className="-ml-3">
                  Creator
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("category")} className="-ml-3">
                  Category
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("event_type")} className="-ml-3">
                  Type
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("start_date")} className="-ml-3">
                  Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>RSVPs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  {searchQuery ? "No events found matching your search" : "No events found"}
                </TableCell>
              </TableRow>
            ) : (
              sortedEvents.map((event) => (
                <TableRow key={event.id} className={isPastEvent(event) ? "opacity-60" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={(checked) => handleSelectEvent(event.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      {event.hero_image ? (
                        <AvatarImage src={event.hero_image || "/placeholder.svg"} alt={event.title} />
                      ) : (
                        <AvatarFallback>
                          {event.event_type === "virtual" ? "🌐" : event.event_type === "hybrid" ? "🔀" : "📍"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/t/${slug}/dashboard/events/${event.id}`}
                          className="font-medium hover:underline line-clamp-1"
                        >
                          {event.title}
                        </Link>
                        {event.location_type === "custom" && event.custom_location_name && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{event.custom_location_name}</span>
                          </div>
                        )}
                      </div>
                      {event.flag_count > 0 && (
                        <Badge variant="destructive" className="shrink-0">
                          <Flag className="h-3 w-3 mr-1" />
                          {event.flag_count}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {event.users ? getInitials(event.users.first_name, event.users.last_name) : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {event.users ? `${event.users.first_name} ${event.users.last_name}` : "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.event_categories ? (
                      <div className="flex items-center gap-1.5">
                        {event.event_categories.icon && <span>{event.event_categories.icon}</span>}
                        <span className="text-sm">{event.event_categories.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getEventTypeLabel(event.event_type)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{getEventDate(event)}</TableCell>
                  <TableCell>
                    <Badge variant={event.status === "cancelled" ? "destructive" : "default"}>{event.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{getVisibilityLabel(event.visibility_scope)}</span>
                  </TableCell>
                  <TableCell>
                    {event.requires_rsvp ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {event.rsvp_count}
                          {event.max_attendees ? `/${event.max_attendees}` : ""}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/t/${slug}/dashboard/events/${event.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/t/${slug}/dashboard/events/${event.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
