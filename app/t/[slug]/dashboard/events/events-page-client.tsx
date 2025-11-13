"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, Filter, X, ChevronDown } from "lucide-react"
import { EventsList } from "./events-list"
import { EventsCalendar } from "./events-calendar"

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
  flag_count?: number
}

interface Category {
  id: string
  name: string
  icon: string
}

export function EventsPageClient({
  events,
  categories,
  slug,
  userId,
  tenantId,
}: {
  events: Event[]
  categories: Category[]
  slug: string
  userId: string
  tenantId: string
}) {
  const [view, setView] = useState("list")

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [eventType, setEventType] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")

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
  }

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || eventType !== "all" || timeFilter !== "all"

  const activeFilterCount =
    (searchQuery ? 1 : 0) + selectedCategories.length + (eventType !== "all" ? 1 : 0) + (timeFilter !== "all" ? 1 : 0)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between bg-transparent">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Categories
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedCategories.length}
                    </Badge>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Select Categories</h4>
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
                      {category.icon && <span>{category.icon}</span>}
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between bg-transparent">
                <span className="flex items-center gap-2">
                  Type
                  {eventType !== "all" && (
                    <Badge variant="secondary" className="ml-1 capitalize">
                      {eventType}
                    </Badge>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Event Type</h4>
                {[
                  { value: "all", label: "All Events" },
                  { value: "resident", label: "Resident Created" },
                  { value: "official", label: "Official" },
                ].map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`type-${option.value}`}
                      checked={eventType === option.value}
                      onCheckedChange={() => setEventType(option.value)}
                    />
                    <Label htmlFor={`type-${option.value}`} className="cursor-pointer text-sm font-normal flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between bg-transparent">
                <span className="flex items-center gap-2">
                  Time
                  {timeFilter !== "all" && (
                    <Badge variant="secondary" className="ml-1 capitalize">
                      {timeFilter}
                    </Badge>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Time Period</h4>
                {[
                  { value: "all", label: "All Events" },
                  { value: "upcoming", label: "Upcoming" },
                  { value: "past", label: "Past" },
                ].map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`time-${option.value}`}
                      checked={timeFilter === option.value}
                      onCheckedChange={() => setTimeFilter(option.value)}
                    />
                    <Label htmlFor={`time-${option.value}`} className="cursor-pointer text-sm font-normal flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
              </Badge>
            )}
            {selectedCategories.map((catId) => {
              const category = categories.find((c) => c.id === catId)
              return (
                <Badge key={catId} variant="secondary" className="gap-1">
                  {category?.icon} {category?.name}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleCategoryToggle(catId)} />
                </Badge>
              )
            })}
            {eventType !== "all" && (
              <Badge variant="secondary" className="gap-1 capitalize">
                {eventType}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setEventType("all")} />
              </Badge>
            )}
            {timeFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 capitalize">
                {timeFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setTimeFilter("all")} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7">
              Clear all
            </Button>
          </div>
        )}
      </div>

      <Tabs value={view} onValueChange={setView} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <EventsList
            events={filteredEvents}
            slug={slug}
            hasActiveFilters={hasActiveFilters}
            userId={userId}
            tenantId={tenantId}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <EventsCalendar
            events={filteredEvents}
            slug={slug}
            hasActiveFilters={hasActiveFilters}
            userId={userId}
            tenantId={tenantId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
