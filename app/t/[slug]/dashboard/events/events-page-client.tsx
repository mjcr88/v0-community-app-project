"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, Filter, X, ChevronDown, Calendar, Clock, Tag } from "lucide-react"
import { EventsList } from "./events-list"
import { EventsCalendar } from "./events-calendar"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

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
  category_id: string | null
  event_categories: {
    id: string
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
}

interface Category {
  id: string
  name: string
  icon: string
}

type FilterSection = "categories" | "type" | "time" | null

export function EventsPageClient({
  events,
  categories,
  slug,
  userId,
  tenantId,
  friendIds = [],
}: {
  events: Event[]
  categories: Category[]
  slug: string
  userId: string
  tenantId: string
  friendIds?: string[]
}) {
  const [view, setView] = useState("list")

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [eventType, setEventType] = useState("all")
  const [timeFilter, setTimeFilter] = useState("upcoming") // Default to upcoming events
  const [activeFilter, setActiveFilter] = useState<FilterSection>(null)

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const titleMatch = event.title.toLowerCase().includes(searchLower)
        const descMatch = event.description?.toLowerCase().includes(searchLower) || false
        if (!titleMatch && !descMatch) return false
      }

      // Category filter
      if (selectedCategories.length > 0) {
        if (!event.category_id || !selectedCategories.includes(event.category_id)) {
          return false
        }
      }

      // Event type filter
      if (eventType !== "all") {
        if (event.event_type !== eventType) return false
      }

      // Time filter
      if (timeFilter !== "all") {
        const today = new Date().toISOString().split("T")[0]
        const eventDate = event.start_date

        if (timeFilter === "upcoming" && eventDate < today) return false
        if (timeFilter === "past" && eventDate >= today) return false
      }

      // Hide declined events (UX Refinement)
      if (event.user_rsvp_status === "no") {
        return false
      }

      return true
    })
  }, [events, searchQuery, selectedCategories, eventType, timeFilter])

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
    setEventType("all")
    setTimeFilter("all")
    setActiveFilter(null)
  }

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || eventType !== "all" || timeFilter !== "all"

  const activeFilterCount =
    (searchQuery ? 1 : 0) + selectedCategories.length + (eventType !== "all" ? 1 : 0) + (timeFilter !== "all" ? 1 : 0)

  const isSearchingOrFiltering = searchQuery || selectedCategories.length > 0 || eventType !== "all"

  let emptyStateVariant: "no-matches" | "no-upcoming" | "no-past" | "no-rsvp" | "no-listings" = "no-upcoming"

  if (isSearchingOrFiltering) {
    emptyStateVariant = "no-matches"
  } else if (timeFilter === "past") {
    emptyStateVariant = "no-past"
  } else {
    // Default to upcoming for "upcoming" or "all" time filters when no other filters are active
    emptyStateVariant = "no-upcoming"
  }

  const filterSections = [
    { id: "categories" as const, label: "Categories", icon: Tag },
    { id: "type" as const, label: "Type", icon: Filter },
    { id: "time" as const, label: "Time", icon: Clock },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
        />
      </div>

      {/* Tabs */}
      <Tabs value={view} onValueChange={setView} className="w-full">
        <TabsList className="bg-muted/30 p-1 rounded-full h-auto inline-flex">
          <TabsTrigger
            value="list"
            className="rounded-full px-6 py-2 border border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <span className="flex items-center gap-2">
              List
              {filteredEvents.length > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] h-auto min-w-[1.25rem] justify-center",
                    view === "list"
                      ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {filteredEvents.length}
                </Badge>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="rounded-full px-6 py-2 border border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <span className="flex items-center gap-2">
              Calendar
              {filteredEvents.length > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] h-auto min-w-[1.25rem] justify-center",
                    view === "calendar"
                      ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {filteredEvents.length}
                </Badge>
              )}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Filter Cards */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {filterSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveFilter(activeFilter === section.id ? null : section.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 h-20 w-full hover:shadow-md",
                  activeFilter === section.id
                    ? "bg-primary/10 border-primary text-primary ring-1 ring-primary shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <section.icon className={cn("w-5 h-5 mb-1.5", activeFilter === section.id ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-medium text-center leading-tight">{section.label}</span>
              </button>
            ))}
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedCategories.map((catId) => {
                const category = categories.find((c) => c.id === catId)
                return (
                  <Badge
                    key={catId}
                    variant="secondary"
                    className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleCategoryToggle(catId)}
                  >
                    {category?.icon} {category?.name}
                    <span className="ml-1">×</span>
                  </Badge>
                )
              })}
              {eventType !== "all" && (
                <Badge
                  variant="secondary"
                  className="gap-1 capitalize cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setEventType("all")}
                >
                  {eventType}
                  <span className="ml-1">×</span>
                </Badge>
              )}
              {timeFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="gap-1 capitalize cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setTimeFilter("all")}
                >
                  {timeFilter}
                  <span className="ml-1">×</span>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                Clear all
              </Button>
            </div>
          )}

          {/* Collapsible Filter Panel */}
          <AnimatePresence mode="wait">
            {activeFilter && (
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-2 border-muted/50">
                  <CardContent className="p-4">
                    {activeFilter === "categories" && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Select Categories</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {categories.map((category) => (
                            <div key={category.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`category-${category.id}`}
                                checked={selectedCategories.includes(category.id)}
                                onCheckedChange={() => handleCategoryToggle(category.id)}
                              />
                              <Label
                                htmlFor={`category-${category.id}`}
                                className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                              >
                                <span className="text-base leading-none">{category.icon}</span>
                                {category.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeFilter === "type" && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: "all", label: "All Events" },
                            { value: "resident", label: "Resident Created" },
                            { value: "official", label: "Official" },
                          ].map((option) => (
                            <Badge
                              key={option.value}
                              variant={eventType === option.value ? "default" : "outline"}
                              className="cursor-pointer px-3 py-1.5"
                              onClick={() => setEventType(option.value)}
                            >
                              {option.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeFilter === "time" && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: "all", label: "All Events" },
                            { value: "upcoming", label: "Upcoming" },
                            { value: "past", label: "Past" },
                          ].map((option) => (
                            <Badge
                              key={option.value}
                              variant={timeFilter === option.value ? "default" : "outline"}
                              className="cursor-pointer px-3 py-1.5"
                              onClick={() => setTimeFilter(option.value)}
                            >
                              {option.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <TabsContent value="list" className="mt-4 md:mt-6">
          <EventsList
            events={filteredEvents}
            slug={slug}
            hasActiveFilters={!!hasActiveFilters}
            userId={userId}
            tenantId={tenantId}
            emptyStateVariant={emptyStateVariant}
            friendIds={friendIds}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4 md:mt-6">
          <EventsCalendar
            events={filteredEvents}
            slug={slug}
            hasActiveFilters={!!hasActiveFilters}
            userId={userId}
            tenantId={tenantId}
            emptyStateVariant={emptyStateVariant}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
