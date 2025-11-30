"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, CheckCircle, XCircle, HelpCircle, Users } from 'lucide-react'
import { markAsRead } from "@/app/actions/notifications"
import { rsvpToEvent } from "@/app/actions/events"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import type { NotificationFull } from "@/types/notifications"
import { getEventCategoryEmoji } from "@/lib/utils/emojis"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EventNotificationCardProps {
    notification: NotificationFull & {
        event?: {
            id: string
            title: string
            start_date: string
            start_time: string | null
            end_date: string | null
            end_time: string | null
            is_all_day: boolean
            location_id: string | null
            custom_location_name: string | null
            location?: {
                id: string
                name: string
            } | null
            category?: {
                id: string
                name: string
                icon?: string | null
            } | null
        } | null
    }
    tenantSlug: string
    userId: string
    onUpdate: () => void
}

export function EventNotificationCard({
    notification,
    tenantSlug,
    userId,
    onUpdate,
}: EventNotificationCardProps) {
    const router = useRouter()
    const [isRsvping, setIsRsvping] = useState(false)

    const event = notification.event
    const actor = notification.actor

    const handleCardClick = async () => {
        if (!notification.is_read) {
            await markAsRead(notification.id, tenantSlug)
            onUpdate()
        }

        if (notification.action_url) {
            router.push(notification.action_url)
        } else if (event?.id) {
            router.push(`/t/${tenantSlug}/dashboard/events/${event.id}`)
        }
    }

    const handleRsvp = async (e: React.MouseEvent, status: "yes" | "maybe" | "no") => {
        e.stopPropagation()
        if (!event?.id) return

        setIsRsvping(true)
        try {
            const result = await rsvpToEvent(event.id, notification.tenant_id, status)
            if (result.success) {
                toast.success(`RSVP: ${status === "yes" ? "Yes" : status === "maybe" ? "Maybe" : "No"}`)
                onUpdate()
            } else {
                toast.error(result.error || "Failed to RSVP")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsRsvping(false)
        }
    }

    const formatEventDate = () => {
        if (!event?.start_date) return null

        try {
            const startDate = parseISO(event.start_date)

            if (event.is_all_day) {
                return format(startDate, "EEE, MMM d")
            }

            if (event.start_time) {
                // Parse time string "HH:mm:ss" or "HH:mm"
                const [hours, minutes] = event.start_time.split(':')
                const timeDate = new Date()
                timeDate.setHours(parseInt(hours), parseInt(minutes))
                const timeStr = format(timeDate, "h:mm a")

                return `${format(startDate, "EEE, MMM d")} • ${timeStr}`
            }

            return format(startDate, "EEE, MMM d")
        } catch {
            return event.start_date
        }
    }

    const getLocationName = () => {
        if (event?.location?.name) return event.location.name
        if (event?.custom_location_name) return event.custom_location_name
        return null
    }

    const showRsvpButtons = notification.type === "event_invite" && !notification.action_taken

    return (
        <Card
            className={cn(
                "transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md rounded-lg group overflow-hidden",
                !notification.is_read ? "border-2 border-secondary" : "bg-card border-border",
            )}
            onClick={handleCardClick}
        >
            <CardContent className="p-3 sm:p-4">
                <div className="flex gap-3">
                    {/* Actor Avatar */}
                    <div className="flex-shrink-0">
                        {actor ? (
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={actor.profile_picture_url || undefined} alt={`${actor.first_name} ${actor.last_name}`} />
                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                    {actor.first_name?.[0]}{actor.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <Users className="h-5 w-5 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm text-foreground">
                                        {actor ? `${actor.first_name} ${actor.last_name}` : "Someone"}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        invited you to an event
                                    </span>
                                    {!notification.is_read && (
                                        <Badge variant="secondary" className="bg-secondary/10 text-secondary text-[10px] px-1.5 py-0 h-5">
                                            New
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {format(parseISO(notification.created_at), "MMM d, h:mm a")}
                                </p>
                            </div>

                            {/* Quick Actions */}
                            {showRsvpButtons && (
                                <div className="flex items-center gap-1">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full border-dashed border-green-500/50 text-green-600 hover:bg-green-50 hover:border-green-500 shrink-0"
                                                    onClick={(e) => handleRsvp(e, "yes")}
                                                    disabled={isRsvping}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Going</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full border-dashed border-yellow-500/50 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-500 shrink-0"
                                                    onClick={(e) => handleRsvp(e, "maybe")}
                                                    disabled={isRsvping}
                                                >
                                                    <HelpCircle className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Maybe</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full border-dashed border-red-500/50 text-red-600 hover:bg-red-50 hover:border-red-500 shrink-0"
                                                    onClick={(e) => handleRsvp(e, "no")}
                                                    disabled={isRsvping}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Not Going</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )}
                        </div>

                        {/* Event Details Card */}
                        {event && (
                            <div className="bg-muted/40 rounded-md p-2.5 border border-border/50 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {event.category && (
                                            <Badge variant="outline" className="bg-background text-xs font-normal py-0.5 px-2 gap-1.5 shrink-0">
                                                <span>{getEventCategoryEmoji(event.category.name)}</span>
                                                <span>{event.category.name}</span>
                                            </Badge>
                                        )}
                                        <h5 className="font-medium text-sm text-foreground truncate">{event.title}</h5>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {formatEventDate() && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Calendar className="h-3 w-3 shrink-0" />
                                            <span>{formatEventDate()}</span>
                                        </div>
                                    )}
                                    {getLocationName() && (
                                        <div className="flex items-center gap-1 min-w-0 max-w-[150px]">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{getLocationName()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
