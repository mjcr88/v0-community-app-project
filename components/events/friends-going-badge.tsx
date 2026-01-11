"use client"

import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { useMemo } from "react"

interface FriendsGoingBadgeProps {
    /** IDs of users who said "yes" to the event/check-in */
    attendeeIds: string[]
    /** IDs of all neighbors across user's lists (flattened) */
    friendIds: string[]
    /** Optional custom label (default: "friend(s) going") */
    label?: string
    /** Show even if 0 friends */
    showZero?: boolean
}

/**
 * Displays "X friends going" badge based on overlap between attendees and user's neighbor lists.
 */
export function FriendsGoingBadge({
    attendeeIds,
    friendIds,
    label,
    showZero = false,
}: FriendsGoingBadgeProps) {
    const friendsGoing = useMemo(() => {
        if (!attendeeIds?.length || !friendIds?.length) return 0
        const friendIdSet = new Set(friendIds)
        return attendeeIds.filter(id => friendIdSet.has(id)).length
    }, [attendeeIds, friendIds])

    if (friendsGoing === 0 && !showZero) return null

    const text = label || (friendsGoing === 1 ? "friend going" : "friends going")

    return (
        <Badge variant="secondary" className="gap-1 bg-green-50 text-green-700 border-green-200">
            <Users className="h-3 w-3" />
            {friendsGoing} {text}
        </Badge>
    )
}
