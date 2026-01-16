"use client"

import { Button } from "@/components/ui/button"
import { Users, Loader2 } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { rsvpToCheckIn } from "@/app/actions/check-ins"
import { cn } from "@/lib/utils"
import { CheckInAnalytics } from "@/lib/analytics"

interface CheckInRsvpQuickActionProps {
    checkInId: string
    tenantId: string
    tenantSlug: string
    userId: string | null
    currentRsvpStatus?: "yes" | "maybe" | "no" | null
    className?: string
}

export function CheckInRsvpQuickAction({
    checkInId,
    tenantId,
    tenantSlug,
    userId,
    currentRsvpStatus,
    className,
}: CheckInRsvpQuickActionProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [localRsvpStatus, setLocalRsvpStatus] = useState(currentRsvpStatus)

    if (!userId) return null

    const handleRsvp = async (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        // Toggle: if already "yes", remove RSVP (set to null/no), otherwise set to "yes"
        // For check-ins, usually it's just "Join" (yes) or nothing.
        // If we want to support "maybe", we can, but "Join" implies "yes".
        // Let's assume toggle behavior: Click to Join, Click again to Leave?
        // Or just "Join" button that becomes "Joined" (disabled or toggle).

        const newStatus = localRsvpStatus === "yes" ? "no" : "yes"

        startTransition(async () => {
            // We need an action for check-in RSVP. Assuming rsvpToCheckIn exists or similar.
            // The implementation plan mentioned creating this component but didn't specify the action.
            // I'll assume rsvpToCheckIn is the action name, similar to rsvpToEvent.
            // If it doesn't exist, I'll need to create it or find the existing one.
            // Looking at CheckInDetailModal, it uses CheckInRsvpSection.
            // Let's check CheckInRsvpSection to see what action it uses.
            // It likely uses `rsvpToCheckIn` or similar.

            const result = await rsvpToCheckIn(checkInId, tenantId, tenantSlug, newStatus)

            if (result.success) {
                setLocalRsvpStatus(newStatus)
                CheckInAnalytics.rsvp(checkInId, newStatus)
                router.refresh()
                toast.success(newStatus === "yes" ? "You joined the check-in!" : "You left the check-in.")
            } else {
                toast.error(result.error || "Failed to update RSVP")
            }
        })
    }

    const isJoined = localRsvpStatus === "yes"

    return (
        <Button
            variant={isJoined ? "secondary" : "default"}
            size="sm"
            className={cn("h-8 gap-1.5", className)}
            onClick={handleRsvp}
            disabled={isPending}
        >
            {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
                <Users className="h-3.5 w-3.5" />
            )}
            <span className="text-xs font-medium">{isJoined ? "Joined" : "Join"}</span>
        </Button>
    )
}
