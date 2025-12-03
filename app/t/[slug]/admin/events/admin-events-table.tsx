"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil, Eye, ArrowUpDown, Flag, Users, MapPin, Search, X, Trash2, XCircle, ChevronDown } from "lucide-react"
import Link from "next/link"
import { formatDate } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { adminDeleteEvents, adminCancelEvent, adminUnflagEvent } from "@/app/actions/events"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useRioFeedback } from "@/components/feedback/rio-feedback-provider"

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
  location_name: string | null
  max_attendees: number | null
  requires_rsvp: boolean
  created_at: string
  category_id: string | null
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

type Category = {
  id: string
  name: string
  icon: string | null
}

export function AdminEventsTable({
  events,
  slug,
  tenantId,
  categories,
}: {
  events: AdminEvent[]
  slug: string
  tenantId: string
  categories: Category[]
}) {
  const router = useRouter()
  const { showFeedback } = useRioFeedback()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortedEvents, setSortedEvents] = useState<AdminEvent[]>(events)
  const [sortField, setSortField] = useState<string>("start_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all")
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all")
  const [flaggedFilter, setFlaggedFilter] = useState<string>("all")

  // Bulk action states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const filteredEvents = useMemo(() => {
    let filtered = events

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((event) => {
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
        if (event.location_name?.toLowerCase().includes(query)) return true
        return false
      })
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((event) => event.category_id && selectedCategories.includes(event.category_id))
    }

    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((event) => event.event_type === eventTypeFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((event) => event.status === statusFilter)
    }

    if (visibilityFilter !== "all") {
      filtered = filtered.filter((event) => event.visibility_scope === visibilityFilter)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (dateRangeFilter !== "all") {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.start_date)
        eventDate.setHours(0, 0, 0, 0)

        switch (dateRangeFilter) {
          case "past":
            return eventDate < today
          case "today":
            return eventDate.getTime() === today.getTime()
          case "upcoming":
            return eventDate > today
          case "this_week": {
            const weekFromNow = new Date(today)
            weekFromNow.setDate(weekFromNow.getDate() + 7)
            return eventDate >= today && eventDate <= weekFromNow
          }
          case "this_month": {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            return eventDate >= startOfMonth && eventDate <= endOfMonth
          }
          default:
            return true
        }
      })
    }

    if (flaggedFilter === "flagged") {
      filtered = filtered.filter((event) => event.flag_count > 0)
    } else if (flaggedFilter === "not_flagged") {
      filtered = filtered.filter((event) => event.flag_count === 0)
    }

    return filtered
  }, [
    events,
    searchQuery,
    selectedCategories,
    eventTypeFilter,
    statusFilter,
    visibilityFilter,
    dateRangeFilter,
    flaggedFilter,
  ])

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
      } else if (field === "location_name") {
        aVal = a.location_name?.toLowerCase() || ""
        bVal = b.location_name?.toLowerCase() || ""
      } else if (field === "flag_count") {
        aVal = a.flag_count || 0
        bVal = b.flag_count || 0
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

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
    setEventTypeFilter("all")
    setStatusFilter("all")
    setVisibilityFilter("all")
    setDateRangeFilter("all")
    setFlaggedFilter("all")
  }

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategories.length > 0 ||
    eventTypeFilter !== "all" ||
    statusFilter !== "all" ||
    visibilityFilter !== "all" ||
    dateRangeFilter !== "all" ||
    flaggedFilter !== "all"

  const handleBulkDelete = async () => {
    setIsProcessing(true)
    try {
      const result = await adminDeleteEvents(selectedEvents, tenantId, slug)
      if (result.success) {
        showFeedback({
          title: "Events Deleted",
          description: `${selectedEvents.length} event(s) have been permanently removed.`,
          variant: "success",
          image: "/rio/rio_delete_warning.png"
        })
        setSelectedEvents([])
        setShowDeleteDialog(false)
        // Force hard refresh
        window.location.reload()
      } else {
        showFeedback({
          title: "Couldn't delete events",
          description: result.error || "Something went wrong. Please try again.",
          variant: "error",
          image: "/rio/rio_no_results_confused.png"
        })
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  // Bulk cancel handler
  const handleBulkCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason")
      return
    }

    setIsProcessing(true)
    try {
      let successCount = 0
      let failCount = 0

      for (const eventId of selectedEvents) {
        const result = await adminCancelEvent(eventId, tenantId, slug, cancelReason)
        if (result.success) {
          successCount++
        } else {
          failCount++
        }
      }

      if (successCount > 0) {
        showFeedback({
          title: "Events Cancelled",
          description: `${successCount} event(s) have been cancelled.`,
          variant: "success",
          image: "/rio/rio_delete_warning.png"
        })
      }
      if (failCount > 0) {
        showFeedback({
          title: "Some cancellations failed",
          description: `Failed to cancel ${failCount} event(s).`,
          variant: "error",
          image: "/rio/rio_no_results_confused.png"
        })
      }

      setSelectedEvents([])
      setCancelReason("")
      setShowCancelDialog(false)
      router.refresh()
    } catch (error) {
      showFeedback({
        title: "Something went wrong",
        description: "An unexpected error occurred. Please try again.",
        variant: "error",
        image: "/rio/rio_no_results_confused.png"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Bulk unflag handler
  const handleBulkUnflag = async () => {
    const flaggedEvents = selectedEvents.filter((id) => {
      const event = sortedEvents.find((e) => e.id === id)
      return event && event.flag_count > 0
    })

    if (flaggedEvents.length === 0) {
      toast.error("No flagged events selected")
      return
    }

    setIsProcessing(true)
    try {
      let successCount = 0
      let failCount = 0

      for (const eventId of flaggedEvents) {
        const result = await adminUnflagEvent(eventId, tenantId, slug)
        if (result.success) {
          successCount++
        } else {
          failCount++
        }
      }

      if (successCount > 0) {
        showFeedback({
          title: "Events Unflagged",
          description: `${successCount} event(s) have been unflagged.`,
          variant: "success",
          image: "/rio/rio_clapping.png"
        })
      }
      if (failCount > 0) {
        showFeedback({
          title: "Some unflags failed",
          description: `Failed to unflag ${failCount} event(s).`,
          variant: "error",
          image: "/rio/rio_no_results_confused.png"
        })
      }

      setSelectedEvents([])
      router.refresh()
    } catch (error) {
      showFeedback({
        title: "Something went wrong",
        description: "An unexpected error occurred. Please try again.",
        variant: "error",
        image: "/rio/rio_no_results_confused.png"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUnflagEvent = async (eventId: string) => {
    setIsProcessing(true)
    try {
      const result = await adminUnflagEvent(eventId, tenantId, slug)
      if (result.success) {
        showFeedback({
          title: "Event Unflagged",
          description: "The event is no longer flagged.",
          variant: "success",
          image: "/rio/rio_clapping.png"
        })
        router.refresh()
      } else {
        showFeedback({
          title: "Couldn't unflag event",
          description: result.error || "Something went wrong. Please try again.",
          variant: "error",
          image: "/rio/rio_no_results_confused.png"
        })
      }
    } catch (error) {
      showFeedback({
        title: "Something went wrong",
        description: "An unexpected error occurred. Please try again.",
        variant: "error",
        image: "/rio/rio_no_results_confused.png"
      })
    } finally {
      setIsProcessing(false)
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
            placeholder="Search events..."
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
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear all filters
          </Button>
        )}
      </div>

      {/* Bulk action buttons */}
      {selectedEvents.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedEvents.length} event{selectedEvents.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} disabled={isProcessing}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCancelDialog(true)} disabled={isProcessing}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkUnflag} disabled={isProcessing}>
              <Flag className="mr-2 h-4 w-4" />
              Unflag
            </Button>
          </div>
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
                <Button variant="ghost" size="sm" onClick={() => handleSort("location_name")} className="-ml-3">
                  Location
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Category
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {selectedCategories.length > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          {selectedCategories.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {categories.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category.id}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories([...selectedCategories, category.id])
                          } else {
                            setSelectedCategories(selectedCategories.filter((id) => id !== category.id))
                          }
                        }}
                      >
                        {category.icon && <span className="mr-2">{category.icon}</span>}
                        {category.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Type
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {eventTypeFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setEventTypeFilter("all")}>All types</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEventTypeFilter("community")}>Community</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEventTypeFilter("virtual")}>Virtual</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEventTypeFilter("hybrid")}>Hybrid</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Date
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {dateRangeFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by date</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDateRangeFilter("all")}>All dates</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateRangeFilter("past")}>Past</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateRangeFilter("today")}>Today</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateRangeFilter("upcoming")}>Upcoming</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateRangeFilter("this_week")}>This week</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateRangeFilter("this_month")}>This month</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Status
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {statusFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter("all")}>All status</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("published")}>Published</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>Cancelled</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("draft")}>Draft</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Scope
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {visibilityFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by scope</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setVisibilityFilter("all")}>All scopes</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibilityFilter("community")}>Community</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibilityFilter("neighborhood")}>
                      Neighborhood
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibilityFilter("private")}>Private</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>RSVPs</TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      <Flag className="h-4 w-4 mr-2" />
                      <ChevronDown className="h-4 w-4" />
                      {flaggedFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by flags</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFlaggedFilter("all")}>All events</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFlaggedFilter("flagged")}>Flagged only</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFlaggedFilter("not_flagged")}>Not flagged</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground">
                  {hasActiveFilters ? "No events found matching your filters" : "No events found"}
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
                    <Link
                      href={`/t/${slug}/dashboard/events/${event.id}`}
                      className="font-medium hover:underline line-clamp-1"
                    >
                      {event.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {event.location_name ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="line-clamp-1">{event.location_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
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
                  <TableCell>
                    {event.flag_count > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleUnflagEvent(event.id)}
                        disabled={isProcessing}
                      >
                        <Badge variant="destructive">
                          <Flag className="h-3 w-3 mr-1" />
                          {event.flag_count}
                        </Badge>
                      </Button>
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

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedEvents.length} event(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected events and all associated data
              including RSVPs, images, and flags.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground"
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk cancel confirmation dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {selectedEvents.length} event(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for cancelling these events. This will be visible to attendees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason">Cancellation Reason</Label>
            <Textarea
              id="cancel-reason"
              placeholder="e.g., Due to weather conditions, Due to low attendance, etc."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkCancel} disabled={isProcessing || !cancelReason.trim()}>
              {isProcessing ? "Cancelling..." : "Cancel Events"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
