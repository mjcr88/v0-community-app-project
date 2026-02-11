"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Check, HelpCircle, X, Users, ChevronDown } from 'lucide-react'
import { markAsRead } from "@/app/actions/notifications"
import { rsvpToCheckIn } from "@/app/actions/check-ins"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO, differenceInMinutes } from "date-fns"
import { cn } from "@/lib/utils"
import type { NotificationFull } from "@/types/notifications"
import { getCheckInEmoji } from "@/lib/utils/emojis"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
        const interval = setInterval(updateTimer, 60000)
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
    const { toast } = useToast()
    const [isUpdating, setIsUpdating] = useState(false)
    const [localRsvpStatus, setLocalRsvpStatus] = useState<"yes" | "maybe" | "no" | null>(null)

    const checkIn = notification.check_in
    const actor = notification.actor

    const handleCardClick = async () => {
        if (!notification.is_read) {
            await markAsRead(notification.id, tenantSlug)
            onUpdate()
        }
        router.push(`/t/${tenantSlug}/dashboard?checkInId=${checkIn?.id}`)
    }

    const handleRsvp = async (status: "yes" | "maybe" | "no", e: React.MouseEvent) => {
        e.stopPropagation()
        if (!checkIn?.id) return

        setIsUpdating(true)
        setLocalRsvpStatus(status)

        try {
            const result = await rsvpToCheckIn(checkIn.id, notification.tenant_id, tenantSlug, status, 1)
            if (result.success) {
                const label = status === "yes" ? "joining" : status === "maybe" ? "maybe joining" : "not joining"
                toast({
                    title: "RSVP updated",
                    description: `You're ${label} this check-in`,
                })
                window.dispatchEvent(new CustomEvent('rio-checkin-rsvp-sync', {
                    detail: { checkInId: checkIn.id, status: status === "no" ? null : status }
                }))
                onUpdate()
            } else {
                setLocalRsvpStatus(null)
                toast({
                    title: "RSVP failed",
                    description: result.error || "Failed to update RSVP",
                    variant: "destructive",
                })
            }
        } catch {
            setLocalRsvpStatus(null)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const getLocationName = () => {
        if (checkIn?.location?.name) return checkIn.location.name
        if (checkIn?.custom_location_name) return checkIn.custom_location_name
        return null
    }

    const showRsvpActions = notification.type === "checkin_invite" && !notification.action_taken && !localRsvpStatus

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

                            {/* RSVP Dropdown */}
                            {showRsvpActions && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-1 rounded-full border-dashed border-primary/50 text-primary hover:bg-primary/5 hover:border-primary shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? (
                                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            ) : (
                                                <>
                                                    <span className="text-xs">RSVP</span>
                                                    <ChevronDown className="h-3 w-3" />
                                                </>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                        <DropdownMenuItem onClick={(e) => handleRsvp("yes", e as unknown as React.MouseEvent)} className="gap-2 cursor-pointer">
                                            <Check className="h-4 w-4 text-primary" />
                                            <span>Join</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleRsvp("maybe", e as unknown as React.MouseEvent)} className="gap-2 cursor-pointer">
                                            <HelpCircle className="h-4 w-4 text-secondary" />
                                            <span>Maybe</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleRsvp("no", e as unknown as React.MouseEvent)} className="gap-2 cursor-pointer">
                                            <X className="h-4 w-4 text-destructive" />
                                            <span>Decline</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {/* Show selected status after RSVP */}
                            {localRsvpStatus && (
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "shrink-0 gap-1 text-xs",
                                        localRsvpStatus === "yes" && "border-primary/50 text-primary bg-primary/5",
                                        localRsvpStatus === "maybe" && "border-secondary/50 text-secondary bg-secondary/5",
                                        localRsvpStatus === "no" && "border-destructive/50 text-destructive bg-destructive/5",
                                    )}
                                >
                                    {localRsvpStatus === "yes" && <Check className="h-3 w-3" />}
                                    {localRsvpStatus === "maybe" && <HelpCircle className="h-3 w-3" />}
                                    {localRsvpStatus === "no" && <X className="h-3 w-3" />}
                                    {localRsvpStatus === "yes" ? "Joining" : localRsvpStatus === "maybe" ? "Maybe" : "Declined"}
                                </Badge>
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
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
