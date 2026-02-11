"use client"

import { Button } from "@/components/ui/button"
import { Check, HelpCircle } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { rsvpToCheckIn } from "@/app/actions/check-ins"
import { cn } from "@/lib/utils"
import { CheckInAnalytics } from "@/lib/analytics"
import { NumberTicker } from "@/components/library/number-ticker"

interface CheckInRsvpQuickActionProps {
    checkInId: string
    tenantId: string
    tenantSlug: string
    userId: string | null
    currentRsvpStatus?: "yes" | "maybe" | "no" | null
    currentAttendeeCount?: number
    className?: string
}

export function CheckInRsvpQuickAction({
    checkInId,
    tenantId,
    tenantSlug,
    userId,
    currentRsvpStatus,
    currentAttendeeCount = 0,
    className,
}: CheckInRsvpQuickActionProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isPending, startTransition] = useTransition()
    const [localRsvpStatus, setLocalRsvpStatus] = useState(currentRsvpStatus)
    const [localAttendeeCount, setLocalAttendeeCount] = useState(currentAttendeeCount)

    if (!userId) return null

    const handleRsvp = (status: "yes" | "maybe", e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        // If tapping same status, toggle off (un-RSVP)
        const newStatus = localRsvpStatus === status ? "no" : status

        const previousStatus = localRsvpStatus
        const previousCount = localAttendeeCount

        // Optimistic UI update
        setLocalRsvpStatus(newStatus === "no" ? null : newStatus)

        if (newStatus === "yes" && previousStatus !== "yes") {
            setLocalAttendeeCount(prev => prev + 1)
        } else if (newStatus !== "yes" && previousStatus === "yes") {
            setLocalAttendeeCount(prev => Math.max(0, prev - 1))
        }

        startTransition(async () => {
            const result = await rsvpToCheckIn(checkInId, tenantId, tenantSlug, newStatus)

            if (result.success) {
                CheckInAnalytics.rsvp(checkInId, newStatus)
                router.refresh()
                const labels: Record<string, string> = {
                    yes: "You joined the check-in!",
                    maybe: "Marked as maybe",
                    no: "RSVP removed",
                }
                toast({
                    title: "RSVP updated",
                    description: labels[newStatus],
                })
            } else {
                // Rollback on failure
                setLocalRsvpStatus(previousStatus)
                setLocalAttendeeCount(previousCount)
                toast({
                    title: "RSVP failed",
                    description: result.error || "Failed to update RSVP",
                    variant: "destructive",
                })
            }
        })
    }

    return (
        <div className={cn("flex items-center gap-2", className)} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleRsvp("yes", e)}
                    disabled={isPending}
                    className={cn(
                        "h-7 gap-1.5 px-2.5 flex-shrink-0 transition-all duration-200",
                        localRsvpStatus === "yes"
                            ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            : "hover:bg-primary/10 hover:text-primary",
                        isPending && localRsvpStatus === "yes" && "opacity-100 animate-pulse"
                    )}
                    title="Join"
                >
                    <Check className={cn("h-3.5 w-3.5", localRsvpStatus === "yes" && "stroke-[3px]")} />
                    <span className="text-xs font-medium">Join</span>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleRsvp("maybe", e)}
                    disabled={isPending}
                    className={cn(
                        "h-7 gap-1.5 px-2.5 flex-shrink-0 transition-all duration-200",
                        localRsvpStatus === "maybe"
                            ? "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90"
                            : "hover:bg-secondary/10 hover:text-secondary",
                        isPending && localRsvpStatus === "maybe" && "opacity-100 animate-pulse"
                    )}
                    title="Maybe"
                >
                    <HelpCircle className={cn("h-3.5 w-3.5", localRsvpStatus === "maybe" && "stroke-[3px]")} />
                    <span className="text-xs font-medium">Maybe</span>
                </Button>
            </div>

            {/* Attendee going count */}
            <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <NumberTicker
                    value={localAttendeeCount}
                    className={cn(
                        "text-xs font-semibold px-1 rounded-sm transition-colors",
                        localRsvpStatus === "yes" ? "text-primary bg-primary/10" : "text-muted-foreground"
                    )}
                />
                <span className="text-xs">going</span>
            </div>
        </div>
    )
}
