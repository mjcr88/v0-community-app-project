"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, Filter, X, CheckCheck, Bell, BellOff, Inbox, Archive, FileText } from 'lucide-react'
import { NotificationCard } from "@/components/notifications/notification-card"
import { ExchangeNotificationCard } from "@/components/notifications/exchange-notification-card"
import { EventNotificationCard } from "@/components/notifications/event-notification-card"
import { CheckinNotificationCard } from "@/components/notifications/checkin-notification-card"
import { markAllAsRead } from "@/app/actions/notifications"
import { toast } from "sonner"
import useSWR from "swr"
import type { NotificationFull } from "@/types/notifications"
import { RioEmptyState } from "@/components/exchange/rio-empty-state"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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
    const [activeFilter, setActiveFilter] = useState<"type" | "status" | null>(null)

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
                if (selectedTypes.includes("document") && n.type.startsWith("document_")) matchesType = true
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
        { value: "document", label: "Documents", icon: "📄" },
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

                {/* Filter Cards */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { id: "type" as const, label: "Type", icon: Filter, count: selectedTypes.length },
                        { id: "status" as const, label: "Status", icon: Inbox, count: selectedStatuses.length },
                    ].map((section) => (
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
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-center leading-tight">{section.label}</span>
                                {section.count > 0 && (
                                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                                        {section.count}
                                    </Badge>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

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
                                    {activeFilter === "type" && (
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-sm">Filter by Type</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {typeOptions.map((option) => (
                                                    <div key={option.value} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`type-${option.value}`}
                                                            checked={selectedTypes.includes(option.value)}
                                                            onCheckedChange={() => handleTypeToggle(option.value)}
                                                        />
                                                        <Label
                                                            htmlFor={`type-${option.value}`}
                                                            className="flex items-center gap-2 cursor-pointer text-sm font-normal flex-1"
                                                        >
                                                            <span className="text-base leading-none">{option.icon}</span>
                                                            {option.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeFilter === "status" && (
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-sm">Filter by Status</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {statusOptions.map((option) => (
                                                    <div key={option.value} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`status-${option.value}`}
                                                            checked={selectedStatuses.includes(option.value)}
                                                            onCheckedChange={() => handleStatusToggle(option.value)}
                                                        />
                                                        <Label
                                                            htmlFor={`status-${option.value}`}
                                                            className="flex items-center gap-2 cursor-pointer text-sm font-normal flex-1"
                                                        >
                                                            <option.icon className="h-4 w-4 text-muted-foreground" />
                                                            {option.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                <X className="h-3 w-3 cursor-pointer hover:text-foreground pointer-events-auto" onClick={() => handleTypeToggle(type)} />
                            </Badge>
                        ))}
                        {selectedStatuses.map((status) => (
                            <Badge key={status} variant="secondary" className="gap-1 capitalize">
                                {status.replace('_', ' ')}
                                <X className="h-3 w-3 cursor-pointer hover:text-foreground pointer-events-auto" onClick={() => handleStatusToggle(status)} />
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

            {/* Notifications Header with Mark All Read */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                    {filteredNotifications.length} {filteredNotifications.length === 1 ? 'notification' : 'notifications'}
                </p>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Mark all as read
                    </Button>
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
                        className="py-0 [&>div:first-child]:w-40 [&>div:first-child]:h-40 [&>div:first-child]:mb-2 [&>div:last-child]:mt-4"
                        imageSrc={(() => {
                            // Default view (Unread + Action Required)
                            if (selectedStatuses.length === 2 && selectedStatuses.includes("unread") && selectedStatuses.includes("action_required") && selectedTypes.length === 0 && !searchQuery) {
                                return "/rio/rio_sleeping.png"
                            }

                            // Specific single status filters
                            if (selectedStatuses.length === 1 && selectedTypes.length === 0 && !searchQuery) {
                                if (selectedStatuses[0] === "archived") return "/rio/rio_archived_notifications.png"
                                if (selectedStatuses[0] === "unread") return "/rio/rio_sleeping.png"
                                if (selectedStatuses[0] === "read") return "/rio/rio_searching_confused.png"
                            }

                            // Fallback for searches or other combinations
                            return hasActiveFilters ? "/rio/rio_no_results_confused.png" : "/rio/rio_sleeping.png"
                        })()}
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
