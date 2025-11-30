"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, UserPlus, Check, X, Users } from 'lucide-react'
import { markAsRead } from "@/app/actions/notifications"
import { rsvpToCheckIn } from "@/app/actions/check-ins"
import { toast } from "sonner"
import { format, parseISO, differenceInMinutes } from "date-fns"
import { cn } from "@/lib/utils"
import type { NotificationFull } from "@/types/notifications"
import { getCheckInEmoji } from "@/lib/utils/emojis"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CheckinNotificationCardProps {
    notification: NotificationFull & {
        check_in?: {
            id: string
            title: string
            activity_type: string
            start_time: string
            duration_minutes: number
            location_id: string | null
            custom_location_name: string | null
            location?: {
                id: string
                name: string
            } | null
        } | null
    }
    tenantSlug: string
    userId: string
    onUpdate: () => void
}

function CheckInTimer({ startTime, durationMinutes }: { startTime: string; durationMinutes: number }) {
    const [elapsed, setElapsed] = useState<string>("")
    const [status, setStatus] = useState<"active" | "ended">("active")

    useEffect(() => {
        const updateTimer = () => {
            const start = parseISO(startTime)
            const now = new Date()
            const diff = differenceInMinutes(now, start)
            const totalDuration = durationMinutes

            if (diff < 0) {
                setElapsed(`Starts in ${Math.abs(diff)}m`)
                setStatus("active")
            } else if (diff > totalDuration) {
                setElapsed("Ended")
                setStatus("ended")
            } else {
                const hours = Math.floor(diff / 60)
                const mins = diff % 60
                setElapsed(`${hours > 0 ? `${hours}h ` : ""}${mins}m ago`)
                setStatus("active")
            }
        }

        updateTimer()
        const interval = setInterval(updateTimer, 60000) // Update every minute
        return () => clearInterval(interval)
    }, [startTime, durationMinutes])

    return (
        <span className={cn("text-xs font-medium", status === "ended" ? "text-muted-foreground" : "text-green-600")}>
            {elapsed}
        </span>
    )
}

export function CheckinNotificationCard({
    notification,
    tenantSlug,
    userId,
    onUpdate,
}: CheckinNotificationCardProps) {
    const router = useRouter()
    const [isJoining, setIsJoining] = useState(false)

    const checkIn = notification.check_in
    const actor = notification.actor

    const handleCardClick = async () => {
        if (!notification.is_read) {
            await markAsRead(notification.id, tenantSlug)
            onUpdate()
        }

        // Open check-in modal via URL query param or navigate to dashboard where it opens
        // For now, navigating to events page is the standard behavior, but user requested opening the modal.
        // Assuming the dashboard handles ?checkInId=... or similar, or just go to dashboard.
        // The user said "open the check-in modal (like on the user dashboard)".
        // This usually implies navigating to the dashboard with a query param.
        router.push(`/t/${tenantSlug}/dashboard?checkInId=${checkIn?.id}`)
    }

    const handleJoin = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!checkIn?.id) return

        setIsJoining(true)
        try {
            const result = await rsvpToCheckIn(checkIn.id, notification.tenant_id, tenantSlug, "yes", 1)
            if (result.success) {
                toast.success("You're joining this check-in!")
                onUpdate()
            } else {
                toast.error(result.error || "Failed to join")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsJoining(false)
        }
    }

    const getLocationName = () => {
        if (checkIn?.location?.name) return checkIn.location.name
        if (checkIn?.custom_location_name) return checkIn.custom_location_name
        return null
    }

    const showJoinButton = notification.type === "checkin_invite" && !notification.action_taken

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
                                        invited you to a check-in
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
                            {showJoinButton && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full border-dashed border-primary/50 text-primary hover:bg-primary/5 hover:border-primary shrink-0"
                                                onClick={handleJoin}
                                                disabled={isJoining}
                                            >
                                                {isJoining ? (
                                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                ) : (
                                                    <UserPlus className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Join Check-in</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>

                        {/* Check-in Details Card */}
                        {checkIn && (
                            <div className="bg-muted/40 rounded-md p-2.5 border border-border/50 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Badge variant="outline" className="bg-background text-xs font-normal py-0.5 px-2 gap-1.5 shrink-0">
                                            <span>{getCheckInEmoji(checkIn.activity_type)}</span>
                                            <span className="capitalize">{checkIn.activity_type.replace(/_/g, " ")}</span>
                                        </Badge>
                                        <h5 className="font-medium text-sm text-foreground truncate">{checkIn.title}</h5>
                                    </div>
                                    <CheckInTimer startTime={checkIn.start_time} durationMinutes={checkIn.duration_minutes} />
                                </div>

                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {getLocationName() && (
                                        <div className="flex items-center gap-1 min-w-0 max-w-[150px]">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{getLocationName()}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 shrink-0" />
                                        <span>{Math.floor(checkIn.duration_minutes / 60)}h {checkIn.duration_minutes % 60 > 0 ? `${checkIn.duration_minutes % 60}m` : ""}</span>
                                    </div>
                                    {/* Placeholder for RSVP count if we had it */}
                                    {/* <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3 shrink-0" />
                                        <span>3 joined</span>
                                    </div> */}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
