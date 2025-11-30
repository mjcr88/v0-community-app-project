"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, Filter, X, ChevronDown, CheckCheck, Bell, BellOff, Inbox, Archive } from 'lucide-react'
import { NotificationCard } from "@/components/notifications/notification-card"
import { ExchangeNotificationCard } from "@/components/notifications/exchange-notification-card"
import { EventNotificationCard } from "@/components/notifications/event-notification-card"
import { CheckinNotificationCard } from "@/components/notifications/checkin-notification-card"
import { markAllAsRead } from "@/app/actions/notifications"
import { toast } from "sonner"
import useSWR from "swr"
import type { NotificationFull } from "@/types/notifications"
import { RioEmptyState } from "@/components/exchange/rio-empty-state"

interface NotificationPageClientProps {
    tenantSlug: string
    tenantId: string
    userId: string
    initialNotifications: NotificationFull[]
}

export function NotificationPageClient({
    tenantSlug,
    tenantId,
    userId,
    initialNotifications,
}: NotificationPageClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    // Default to showing unread and action required items
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["unread", "action_required"])
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])

    // Fetch notifications with SWR for real-time updates
    const { data: notifications, mutate } = useSWR<NotificationFull[]>(
        `/api/notifications/${tenantId}`,
        async () => {
            const response = await fetch(`/api/notifications/${tenantId}`)
            if (!response.ok) return initialNotifications
            const data = await response.json()
            return Array.isArray(data) ? data : initialNotifications
        },
        {
            fallbackData: initialNotifications,
            refreshInterval: 30000,
            revalidateOnFocus: true,
        },
    )

    const activeNotifications = notifications || []

    // Derived state for counts
    const unreadCount = activeNotifications.filter((n) => !n.is_read && !n.is_archived).length
    const actionRequiredCount = activeNotifications.filter((n) => n.action_required && !n.action_taken && !n.is_archived).length

    const filteredNotifications = useMemo(() => {
        return activeNotifications.filter((n) => {
            // 1. Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const titleMatch = n.title.toLowerCase().includes(query)
                const messageMatch = n.message?.toLowerCase().includes(query) || false
                const actorMatch = n.actor
                    ? `${n.actor.first_name} ${n.actor.last_name}`.toLowerCase().includes(query)
                    : false

                if (!titleMatch && !messageMatch && !actorMatch) return false
            }

            // 2. Type Filter
            if (selectedTypes.length > 0) {
                const typeCategory = n.type.split('_')[0] // 'exchange', 'event', 'checkin'
                // Map specific types to categories if needed, or just use prefix
                let matchesType = false
                if (selectedTypes.includes("exchange") && n.type.startsWith("exchange_")) matchesType = true
                if (selectedTypes.includes("event") && n.type.startsWith("event_")) matchesType = true
                if (selectedTypes.includes("checkin") && n.type.startsWith("checkin_")) matchesType = true
                if (selectedTypes.includes("announcement") && n.type.startsWith("announcement")) matchesType = true
                if (selectedTypes.includes("system") && !n.type.includes("_")) matchesType = true // Fallback for simple types

                if (!matchesType) return false
            }

            // 3. Status Filter
            if (selectedStatuses.length > 0) {
                let matchesStatus = false

                // OR logic for statuses
                if (selectedStatuses.includes("unread") && !n.is_read && !n.is_archived) matchesStatus = true
                if (selectedStatuses.includes("action_required") && n.action_required && !n.action_taken && !n.is_archived) matchesStatus = true
                if (selectedStatuses.includes("read") && n.is_read && !n.is_archived) matchesStatus = true
                if (selectedStatuses.includes("archived") && n.is_archived) matchesStatus = true

                // Special case: "All" isn't a filter, it's the absence of filters, but if we have specific ones selected:
                if (!matchesStatus) return false
            }

            return true
        })
    }, [activeNotifications, searchQuery, selectedTypes, selectedStatuses])

    const handleMarkAllAsRead = async () => {
        const result = await markAllAsRead(tenantId, tenantSlug)
        if (result.success) {
            toast.success("All notifications marked as read")
            mutate()
        } else {
            toast.error(result.error || "Failed to mark all as read")
        }
    }

    const handleStatusToggle = (status: string) => {
        setSelectedStatuses((prev) =>
            prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
        )
    }

    const handleTypeToggle = (type: string) => {
        setSelectedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        )
    }

    const clearFilters = () => {
        setSearchQuery("")
        setSelectedTypes([])
        setSelectedStatuses(["unread", "action_required"]) // Reset to default view
    }

    const hasActiveFilters =
        searchQuery ||
        selectedTypes.length > 0 ||
        (selectedStatuses.length !== 2 || !selectedStatuses.includes("unread") || !selectedStatuses.includes("action_required"))

    const typeOptions = [
        { value: "exchange", label: "Exchange", icon: "🔄" },
        { value: "event", label: "Events", icon: "📅" },
        { value: "announcement", label: "Announcements", icon: "📢" },
        { value: "checkin", label: "Check-ins", icon: "📍" },
    ]

    const statusOptions = [
        { value: "unread", label: "Unread", icon: Bell },
        { value: "action_required", label: "Action Required", icon: BellOff },
        { value: "read", label: "Read", icon: Inbox },
        { value: "archived", label: "Archived", icon: Archive },
    ]

    return (
        <div className="space-y-6">
            {/* Controls Header */}
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-11 bg-card border-border shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Type Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-between bg-card border-border shadow-sm hover:bg-accent hover:text-accent-foreground min-w-[140px]">
                                    <span className="flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        Type
                                        {selectedTypes.length > 0 && (
                                            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                                {selectedTypes.length}
                                            </Badge>
                                        )}
                                    </span>
                                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 shadow-lg border-border" align="start">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm px-1">Filter by Type</h4>
                                    {typeOptions.map((option) => (
                                        <div key={option.value} className="flex items-center gap-2 px-1">
                                            <Checkbox
                                                id={`type-${option.value}`}
                                                checked={selectedTypes.includes(option.value)}
                                                onCheckedChange={() => handleTypeToggle(option.value)}
                                            />
                                            <Label
                                                htmlFor={`type-${option.value}`}
                                                className="flex items-center gap-2 cursor-pointer text-sm font-normal flex-1 py-1"
                                            >
                                                <span>{option.icon}</span>
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Status Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-between bg-card border-border shadow-sm hover:bg-accent hover:text-accent-foreground min-w-[140px]">
                                    <span className="flex items-center gap-2">
                                        <Inbox className="h-4 w-4" />
                                        Status
                                        {selectedStatuses.length > 0 && (
                                            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                                {selectedStatuses.length}
                                            </Badge>
                                        )}
                                    </span>
                                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 shadow-lg border-border" align="start">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm px-1">Filter by Status</h4>
                                    {statusOptions.map((option) => (
                                        <div key={option.value} className="flex items-center gap-2 px-1">
                                            <Checkbox
                                                id={`status-${option.value}`}
                                                checked={selectedStatuses.includes(option.value)}
                                                onCheckedChange={() => handleStatusToggle(option.value)}
                                            />
                                            <Label
                                                htmlFor={`status-${option.value}`}
                                                className="flex items-center gap-2 cursor-pointer text-sm font-normal flex-1 py-1"
                                            >
                                                <option.icon className="h-4 w-4 text-muted-foreground" />
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Mark All Read Button */}
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="ml-auto sm:ml-0 text-muted-foreground hover:text-foreground"
                        >
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 flex-wrap pt-2">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        {searchQuery && (
                            <Badge variant="secondary" className="gap-1">
                                Search: {searchQuery}
                                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setSearchQuery("")} />
                            </Badge>
                        )}
                        {selectedTypes.map((type) => (
                            <Badge key={type} variant="secondary" className="gap-1 capitalize">
                                {type}
                                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => handleTypeToggle(type)} />
                            </Badge>
                        ))}
                        {selectedStatuses.map((status) => (
                            <Badge key={status} variant="secondary" className="gap-1 capitalize">
                                {status.replace('_', ' ')}
                                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => handleStatusToggle(status)} />
                            </Badge>
                        ))}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                        >
                            Reset to default
                        </Button>
                    </div>
                )}
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {filteredNotifications.length > 0 ? (
                    <div className="grid gap-3">
                        {filteredNotifications.map((notification) => {
                            // Event notifications
                            if (notification.type.startsWith('event_')) {
                                return (
                                    <EventNotificationCard
                                        key={notification.id}
                                        notification={notification}
                                        tenantSlug={tenantSlug}
                                        userId={userId}
                                        onUpdate={mutate}
                                    />
                                )
                            }

                            // Check-in notifications
                            if (notification.type.startsWith('checkin_')) {
                                return (
                                    <CheckinNotificationCard
                                        key={notification.id}
                                        notification={notification}
                                        tenantSlug={tenantSlug}
                                        userId={userId}
                                        onUpdate={mutate}
                                    />
                                )
                            }

                            // Exchange notifications
                            if (notification.type.startsWith('exchange_')) {
                                return (
                                    <ExchangeNotificationCard
                                        key={notification.id}
                                        notification={notification}
                                        tenantSlug={tenantSlug}
                                        userId={userId}
                                        onUpdate={mutate}
                                    />
                                )
                            }

                            // Default notification card for all others
                            return (
                                <NotificationCard
                                    key={notification.id}
                                    notification={notification}
                                    tenantSlug={tenantSlug}
                                    onUpdate={mutate}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <RioEmptyState
                        variant={hasActiveFilters ? "no-matches" : "no-listings"}
                        title={hasActiveFilters ? "No notifications found" : "All caught up!"}
                        description={
                            hasActiveFilters
                                ? "Try adjusting your filters to see more results."
                                : "You've seen everything new. Río is taking a siesta too. ☀️"
                        }
                        action={
                            hasActiveFilters ? (
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            ) : undefined
                        }
                    />
                )}
            </div>
        </div>
    )
}
