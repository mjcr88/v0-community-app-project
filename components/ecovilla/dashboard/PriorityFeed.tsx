"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/library/card"
import { Badge } from "@/components/library/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Calendar, Megaphone, MapPin, Package, Bell,
    Star,
    Check,
    Loader2,
    Heart,
    X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import useSWR, { useSWRConfig } from "swr"
import { rsvpToEvent, saveEvent, unsaveEvent } from "@/app/actions/events"
import { rsvpToCheckIn } from "@/app/actions/check-ins"
import { useToast } from "@/hooks/use-toast"
import { DashboardAnalytics } from "@/lib/analytics"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"

interface ApiPriorityItem {
    type: "announcement" | "event" | "check_in" | "listing" | "exchange_request" | "exchange_confirmed" | "exchange_rejected" | "exchange_return_due"
    id: string
    title: string
    description: string
    urgency: "high" | "medium" | "low"
    timestamp: string
    priority: number
    score?: number
    // Check-in specific
    count?: number
    location?: string
    creator_avatar?: string
    creator_name?: string
    end_time?: string
    attendees?: string[]
    // Event specific
    is_ongoing?: boolean
    rsvp_status?: "going" | "maybe" | "not_going" | null
    is_saved?: boolean
    is_series?: boolean
    parent_event_id?: string | null
    start_date?: string | null
    // Listing specific
    status?: string
    // Transaction specific
    transaction_id?: string
    is_overdue?: boolean
}

interface PriorityFeedResponse {
    items: ApiPriorityItem[]
}

const typeColors: Record<string, string> = {
    announcement: "bg-orange-100 text-orange-700 border-orange-200",
    event: "bg-blue-100 text-blue-700 border-blue-200",
    check_in: "bg-green-100 text-green-700 border-green-200",
    listing: "bg-purple-100 text-purple-700 border-purple-200",
    exchange_request: "bg-destructive/10 text-destructive border-destructive/20",
    exchange_return_due: "bg-secondary/10 text-secondary border-secondary/20",
    exchange_confirmed: "bg-emerald-100 text-emerald-600 border-emerald-200",
    exchange_rejected: "bg-gray-100 text-gray-600 border-gray-200",
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function PriorityFeed({ slug, userId, tenantId }: { slug: string; userId: string; tenantId: string }) {
    const router = useRouter()
    const { toast } = useToast()
    const { data, isLoading, error, mutate } = useSWR<PriorityFeedResponse>(
        `/api/dashboard/priority`,
        fetcher,
        { refreshInterval: 30000 }
    )

    // Optimistic state management
    const [optimisticRsvps, setOptimisticRsvps] = useState<Record<string, "going" | "maybe" | "not_going" | null>>({})
    const [optimisticSaves, setOptimisticSaves] = useState<Record<string, boolean>>({})
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
    const [dismissedItems, setDismissedItems] = useState<string[]>([])
    const { mutate: globalMutate } = useSWRConfig()

    // Series RSVP state
    const [showSeriesDialog, setShowSeriesDialog] = useState(false)
    const [pendingRsvp, setPendingRsvp] = useState<{
        itemId: string;
        itemType: "event" | "check_in";
        status: "going" | "maybe" | "not_going";
        currentStatus: string | null;
    } | null>(null)

    useEffect(() => {
        const saved = localStorage.getItem("dismissed_priority_items")
        if (saved) {
            setDismissedItems(JSON.parse(saved))
        }
    }, [])

    // Synchronize series RSVPs from other components
    useEffect(() => {
        const handleSync = (e: Event) => {
            const customEvent = e as CustomEvent<{
                seriesId: string
                status: "yes" | "maybe" | "no" | null
                startDate: string
            }>
            const { seriesId, status: newStatus, startDate: syncDate } = customEvent.detail

            // Scan through all items in the feed
            const items = data?.items || []
            items.forEach(item => {
                if (item.type === 'event') {
                    const currentSeriesId = item.parent_event_id || item.id
                    if (seriesId === currentSeriesId && item.start_date && syncDate && item.start_date >= syncDate) {
                        // Map internal standard 'yes'/'no' to this component's 'going'/'not_going'
                        const mappedStatus = newStatus === 'yes' ? 'going' : newStatus === 'no' ? 'not_going' : newStatus

                        setOptimisticRsvps(prev => ({
                            ...prev,
                            [item.id]: mappedStatus
                        }))
                    }
                }
            })
        }

        window.addEventListener('rio-series-rsvp-sync', handleSync)
        return () => window.removeEventListener('rio-series-rsvp-sync', handleSync)
    }, [data]) // Re-bind if data changes

    const handleDismiss = (item: ApiPriorityItem) => {
        const newDismissed = [...dismissedItems, item.id]
        setDismissedItems(newDismissed)
        localStorage.setItem("dismissed_priority_items", JSON.stringify(newDismissed))
        DashboardAnalytics.priorityItemDismissed(item.type, item.id)
        toast({ title: "Item dismissed", duration: 2000 })
    }

    const handleItemClick = (item: ApiPriorityItem) => {
        DashboardAnalytics.priorityItemClicked(item.type, item.id)
        if (item.type === "event") {
            router.push(`/t/${slug}/dashboard/events/${item.id}`)
        } else if (item.type === "listing") {
            router.push(`/t/${slug}/dashboard/exchange/${item.id}`)
        } else if (item.type.includes("exchange")) {
            router.push(`/t/${slug}/dashboard/notifications?highlight=${item.id}`)
        }
    }

    const handleSaveToggle = async (itemId: string, currentlySaved: boolean) => {
        // Optimistic update
        setOptimisticSaves(prev => ({ ...prev, [itemId]: !currentlySaved }))
        setLoadingStates(prev => ({ ...prev, [`save-${itemId}`]: true }))

        try {
            const result = currentlySaved
                ? await unsaveEvent(itemId, tenantId)
                : await saveEvent(itemId, tenantId)

            if (!result.success) {
                // Revert on error
                setOptimisticSaves(prev => ({ ...prev, [itemId]: currentlySaved }))
                toast({
                    title: "Error",
                    description: result.error || "Failed to update saved status",
                    variant: "destructive",
                })
            } else {
                // Refresh the data
                mutate()
            }
        } catch (err) {
            // Revert on error
            setOptimisticSaves(prev => ({ ...prev, [itemId]: currentlySaved }))
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setLoadingStates(prev => ({ ...prev, [`save-${itemId}`]: false }))
        }
    }

    const handleRsvp = async (
        itemId: string,
        itemType: "event" | "check_in",
        status: "going" | "maybe" | "not_going",
        currentStatus: string | null,
        scope: "this" | "series" = "this"
    ) => {
        // If clicking the same status, treat as removal (set to null)
        const newStatus = currentStatus === status ? null : status

        // Optimistic update  
        setOptimisticRsvps(prev => ({ ...prev, [itemId]: newStatus }))
        setLoadingStates(prev => ({ ...prev, [`rsvp-${itemId}`]: true }))

        try {
            let result
            // Map UI status to API status
            const apiStatus = newStatus === null ? "no" :
                newStatus === "going" ? "yes" :
                    newStatus === "not_going" ? "no" :
                        "maybe"

            if (itemType === "event") {
                result = await rsvpToEvent(itemId, tenantId, apiStatus, scope)
            } else {
                result = await rsvpToCheckIn(itemId, tenantId, slug, apiStatus)
            }

            if (!result.success) {
                // Revert on error
                setOptimisticRsvps(prev => ({ ...prev, [itemId]: currentStatus as any }))
                toast({
                    title: "Error",
                    description: result.error || "Failed to update RSVP",
                    variant: "destructive",
                })
            } else {
                // Dispatch sync event for other cards on the page if this was a series RSVP
                if (scope === "series" && itemType === "event") {
                    // Try to find the item in the local data to get series metadata
                    const item = data?.items.find(i => i.id === itemId)
                    if (item) {
                        const internalStatus = newStatus === 'going' ? 'yes' : newStatus === 'not_going' ? 'no' : newStatus
                        const syncEvent = new CustomEvent('rio-series-rsvp-sync', {
                            detail: {
                                seriesId: item.parent_event_id || item.id,
                                status: internalStatus,
                                startDate: item.start_date || ""
                            }
                        })
                        window.dispatchEvent(syncEvent)
                    }
                }

                // Refresh the data
                mutate()

                // Also mutate upcoming events widget since they might share data
                globalMutate((key) => typeof key === 'string' && key.startsWith(`/api/events/upcoming/${tenantId}`), undefined, { revalidate: true })
            }
        } catch (err) {
            // Revert on error
            setOptimisticRsvps(prev => ({ ...prev, [itemId]: currentStatus as any }))
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setLoadingStates(prev => ({ ...prev, [`rsvp-${itemId}`]: false }))
        }
    }

    const renderActions = (item: ApiPriorityItem) => {
        switch (item.type) {
            case "announcement":
                return (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/t/${slug}/dashboard/announcements/${item.id}`)
                    }}>
                        View Details
                    </Button>
                )
            case "exchange_request":
                return (
                    <div className="flex items-center gap-2">
                        <Button size="sm" className="h-7 text-xs px-3 bg-green-600 hover:bg-green-700 text-white" onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/t/${slug}/dashboard/notifications?highlight=${item.transaction_id}`)
                        }}>
                            View
                        </Button>
                    </div>
                )
            case "exchange_confirmed":
                return (
                    <div className="flex items-center gap-2">
                        <Button size="sm" className="h-7 text-xs px-3 bg-green-600 hover:bg-green-700 text-white" onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/t/${slug}/dashboard/notifications?highlight=${item.transaction_id}`)
                        }}>
                            Confirm Pickup
                        </Button>
                    </div>
                )
            case "exchange_return_due":
                return (
                    <div className="flex items-center gap-2">
                        <Button size="sm" className="h-7 text-xs px-3 bg-orange-500 hover:bg-orange-600 text-white" onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/t/${slug}/dashboard/notifications?highlight=${item.transaction_id}`)
                        }}>
                            Confirm Returned
                        </Button>
                    </div>
                )
            case "event":
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn("h-7 w-7", item.is_saved && "text-red-500 hover:text-red-600")}
                            onClick={(e) => {
                                e.stopPropagation()
                                const currentSaved = optimisticSaves[item.id] ?? item.is_saved
                                handleSaveToggle(item.id, currentSaved)
                            }}
                        >
                            <Heart className={cn("h-4 w-4", item.is_saved && "fill-current")} />
                        </Button>

                        <div className="h-4 w-px bg-border mx-1" />

                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn("h-7 w-7", (optimisticRsvps[item.id] ?? item.rsvp_status) === 'going' && "text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary")}
                            onClick={(e) => {
                                e.stopPropagation()
                                const currentRsvp = optimisticRsvps[item.id] ?? item.rsvp_status ?? null
                                if (item.is_series && currentRsvp !== 'going') {
                                    setPendingRsvp({ itemId: item.id, itemType: "event", status: "going", currentStatus: currentRsvp })
                                    setShowSeriesDialog(true)
                                } else {
                                    handleRsvp(item.id, "event", "going", currentRsvp)
                                }
                            }}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn("h-7 w-7", (optimisticRsvps[item.id] ?? item.rsvp_status) === 'maybe' && "text-secondary bg-secondary/10 hover:bg-secondary/20 hover:text-secondary")}
                            onClick={(e) => {
                                e.stopPropagation()
                                const currentRsvp = optimisticRsvps[item.id] ?? item.rsvp_status ?? null
                                if (item.is_series && currentRsvp !== 'maybe') {
                                    setPendingRsvp({ itemId: item.id, itemType: "event", status: "maybe", currentStatus: currentRsvp })
                                    setShowSeriesDialog(true)
                                } else {
                                    handleRsvp(item.id, "event", "maybe", currentRsvp)
                                }
                            }}
                        >
                            <span className="text-xs font-bold">?</span>
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn("h-7 w-7", (optimisticRsvps[item.id] ?? item.rsvp_status) === 'not_going' && "text-destructive bg-destructive/10 hover:bg-destructive/20 hover:text-destructive")}
                            onClick={(e) => {
                                e.stopPropagation()
                                const currentRsvp = optimisticRsvps[item.id] ?? item.rsvp_status ?? null
                                if (item.is_series && currentRsvp !== 'not_going') {
                                    setPendingRsvp({ itemId: item.id, itemType: "event", status: "not_going", currentStatus: currentRsvp })
                                    setShowSeriesDialog(true)
                                } else {
                                    handleRsvp(item.id, "event", "not_going", currentRsvp)
                                }
                            }}
                        >
                            <span className="text-xs font-bold">✕</span>
                        </Button>
                    </div>
                )
            case "check_in":
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn("h-7 w-7", (optimisticRsvps[item.id] ?? item.rsvp_status) === 'going' && "text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary")}
                            onClick={(e) => {
                                e.stopPropagation()
                                const currentRsvp = optimisticRsvps[item.id] ?? item.rsvp_status ?? null
                                handleRsvp(item.id, "check_in", "going", currentRsvp)
                            }}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn("h-7 w-7", (optimisticRsvps[item.id] ?? item.rsvp_status) === 'maybe' && "text-secondary bg-secondary/10 hover:bg-secondary/20 hover:text-secondary")}
                            onClick={(e) => {
                                e.stopPropagation()
                                const currentRsvp = optimisticRsvps[item.id] ?? item.rsvp_status ?? null
                                handleRsvp(item.id, "check_in", "maybe", currentRsvp)
                            }}
                        >
                            <span className="text-xs font-bold">?</span>
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn("h-7 w-7", (optimisticRsvps[item.id] ?? item.rsvp_status) === 'not_going' && "text-destructive bg-destructive/10 hover:bg-destructive/20 hover:text-destructive")}
                            onClick={(e) => {
                                e.stopPropagation()
                                const currentRsvp = optimisticRsvps[item.id] ?? item.rsvp_status ?? null
                                handleRsvp(item.id, "check_in", "not_going", currentRsvp)
                            }}
                        >
                            <span className="text-xs font-bold">✕</span>
                        </Button>
                    </div>
                )
            case "exchange_return_due":
            case "exchange_confirmed":
            case "exchange_request":
            case "listing":
                // No action buttons - these are notifications or link to detail pages
                return null
            default:
                return null
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-20 animate-pulse bg-muted rounded-xl" />
                <div className="h-20 animate-pulse bg-muted rounded-xl" />
                <div className="h-20 animate-pulse bg-muted rounded-xl" />
            </div>
        )
    }

    if (error) return <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Failed to load feed</div>

    const allItems = data?.items || []
    const items = allItems.filter(item => !dismissedItems.includes(item.id))

    if (items.length === 0) {
        return (
            <div className="h-full flex flex-col bg-card/30 rounded-2xl border border-border/50 overflow-hidden p-8 text-center text-muted-foreground justify-center items-center">
                <div className="relative w-64 h-64 mb-4">
                    <img
                        src="/rio/rio_sleeping.png"
                        alt="All caught up"
                        className="object-contain w-full h-full"
                    />
                </div>
                <p className="font-medium text-foreground">All caught up!</p>
                <p className="text-sm mt-1">Check back later for more updates.</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-card/30 rounded-2xl border border-border/50 overflow-hidden">
            <div className="space-y-2 overflow-y-auto flex-1 px-4 pb-4 pt-4">
                {items.map((item: ApiPriorityItem) => (
                    <div
                        key={`${item.type}-${item.id}`}
                        className="flex flex-col gap-2 p-3 rounded-xl border bg-card/50 hover:bg-card hover:shadow-sm transition-all cursor-pointer group relative min-h-[88px]"
                        onClick={() => handleItemClick(item)}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                {item.creator_avatar ? (
                                    <Avatar className="w-8 h-8 border shrink-0">
                                        <AvatarImage src={item.creator_avatar} />
                                        <AvatarFallback className={cn("text-[10px]", typeColors[item.type])}>
                                            {item.creator_name?.substring(0, 2).toUpperCase() || "??"}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className={cn("p-1.5 rounded-full shrink-0", typeColors[item.type])}>
                                        {item.type === "announcement" && <Bell className="w-3.5 h-3.5" />}
                                        {item.type === "event" && <Calendar className="w-3.5 h-3.5" />}
                                        {item.type === "check_in" && <MapPin className="w-3.5 h-3.5" />}
                                        {item.type === "listing" && <Star className="w-3.5 h-3.5" />}
                                        {item.type.includes("exchange") && <Package className="w-3.5 h-3.5" />}
                                    </div>
                                )}

                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-normal capitalize", typeColors[item.type])}>
                                            {item.type.replace(/_/g, " ").replace("exchange ", "")}
                                        </Badge>
                                        {item.urgency === "high" && (
                                            <Badge variant="destructive" className="text-[10px] h-5 px-1.5 animate-pulse">Urgent</Badge>
                                        )}
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors mt-0.5">
                                        {item.type === "listing" && <span className="text-primary mr-1">New:</span>}
                                        {item.title}
                                    </p>
                                </div>
                            </div>

                            {/* Actions - Top Right */}
                            <div className="shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {renderActions(item)}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDismiss(item)
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div
                            className="text-xs text-muted-foreground line-clamp-1"
                            dangerouslySetInnerHTML={{ __html: item.description }}
                        />

                        {item.type === "check_in" && item.location && (
                            <div>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {item.location}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <ResponsiveDialog
                isOpen={showSeriesDialog}
                setIsOpen={setShowSeriesDialog}
                title="RSVP to Event Series"
                description="This event repeats. How would you like to RSVP?"
            >
                <div className="flex flex-col gap-3 py-4 px-4">
                    <Button
                        variant="outline"
                        className="justify-start gap-3 h-auto py-3"
                        onClick={() => {
                            if (pendingRsvp) {
                                handleRsvp(pendingRsvp.itemId, pendingRsvp.itemType, pendingRsvp.status, pendingRsvp.currentStatus, "this")
                                setShowSeriesDialog(false)
                            }
                        }}
                    >
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div className="flex flex-col items-start text-left">
                            <span className="font-medium">Just this event</span>
                            <span className="text-xs text-muted-foreground">Only update RSVP for this specific occurrence</span>
                        </div>
                    </Button>
                    <Button
                        variant="outline"
                        className="justify-start gap-3 h-auto py-3"
                        onClick={() => {
                            if (pendingRsvp) {
                                handleRsvp(pendingRsvp.itemId, pendingRsvp.itemType, pendingRsvp.status, pendingRsvp.currentStatus, "series")
                                setShowSeriesDialog(false)
                            }
                        }}
                    >
                        <Check className="h-5 w-5 text-muted-foreground" />
                        <div className="flex flex-col items-start text-left">
                            <span className="font-medium">This and future events</span>
                            <span className="text-xs text-muted-foreground">Update RSVP for all upcoming occurrences in this series</span>
                        </div>
                    </Button>
                </div>
                <div className="hidden sm:flex sm:justify-end sm:gap-2 px-4 pb-4">
                    <Button variant="secondary" onClick={() => setShowSeriesDialog(false)}>
                        Cancel
                    </Button>
                </div>
            </ResponsiveDialog>
        </div>
    )
}
