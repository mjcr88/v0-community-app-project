"use client"

import { useState } from "react"
import { sanitizeHtml } from "@/lib/sanitize-html"
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
    FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { rsvpToEvent, saveEvent, unsaveEvent } from "@/app/actions/events"
import { rsvpToCheckIn } from "@/app/actions/check-ins"
import { useToast } from "@/hooks/use-toast"

interface ApiPriorityItem {
    type: "announcement" | "event" | "check_in" | "listing" | "exchange_request" | "exchange_confirmed" | "exchange_rejected" | "exchange_return_due" | "document"
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
    exchange_request: "bg-red-100 text-red-600 border-red-200",
    exchange_return_due: "bg-amber-100 text-amber-600 border-amber-200",
    exchange_confirmed: "bg-emerald-100 text-emerald-600 border-emerald-200",
    exchange_rejected: "bg-gray-100 text-gray-600 border-gray-200",
    document: "bg-indigo-100 text-indigo-700 border-indigo-200",
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

    const handleItemClick = (item: ApiPriorityItem) => {
        if (item.type === "event") {
            router.push(`/t/${slug}/dashboard/events/${item.id}`)
        } else if (item.type === "listing") {
            router.push(`/t/${slug}/dashboard/exchange/${item.id}`)
        } else if (item.type.includes("exchange")) {
            router.push(`/t/${slug}/dashboard/notifications?highlight=${item.id}`)
        } else if (item.type === "document") {
            router.push(`/t/${slug}/dashboard/official`)
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

    const handleRsvp = async (itemId: string, itemType: "event" | "check_in", status: "going" | "maybe" | "not_going", currentStatus: string | null) => {
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
                result = await rsvpToEvent(itemId, tenantId, apiStatus)
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
                // Refresh the data
                mutate()
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
            case "document":
                return (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/t/${slug}/dashboard/official`)
                    }}>
                        Read Document
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
                            router.push(`/t/${slug}/dashboard/exchange/transactions/${item.transaction_id}`)
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
                            router.push(`/t/${slug}/dashboard/exchange/transactions/${item.transaction_id}`)
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
                            className={cn("h-7 w-7", item.rsvp_status === 'going' && "text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700")}
                            onClick={(e) => {
                                e.stopPropagation()
                                const currentRsvp = optimisticRsvps[item.id] ?? item.rsvp_status ?? null
                                handleRsvp(item.id, "event", "going", currentRsvp)
                            }}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn("h-7 w-7", item.rsvp_status === 'maybe' && "text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700")}
                            onClick={(e) => {
                                e.stopPropagation()
                                const currentRsvp = optimisticRsvps[item.id] ?? item.rsvp_status ?? null
                                handleRsvp(item.id, "event", "maybe", currentRsvp)
                            }}
                        >
                            <span className="text-xs font-bold">?</span>
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn("h-7 w-7", item.rsvp_status === 'not_going' && "text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700")}
                            onClick={(e) => {
                                e.stopPropagation()
                                const currentRsvp = optimisticRsvps[item.id] ?? item.rsvp_status ?? null
                                handleRsvp(item.id, "event", "not_going", currentRsvp)
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
                            className={cn("h-7 w-7", item.rsvp_status === 'going' && "text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700")}
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
                            className={cn("h-7 w-7", item.rsvp_status === 'maybe' && "text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700")}
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
                            className={cn("h-7 w-7", item.rsvp_status === 'not_going' && "text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700")}
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

    const items = data?.items || []

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
                                        {item.type === "document" && <FileText className="w-3.5 h-3.5" />}
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
                            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                {renderActions(item)}
                            </div>
                        </div>

                        <div
                            className="text-xs text-muted-foreground line-clamp-1"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.description) }}
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
        </div>
    )
}
