"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { isPast, parseISO } from "date-fns"

interface EnhancedEventCardProps {
    children: React.ReactNode
    eventDate: string
    isPriority?: boolean
    isCancelled?: boolean
    className?: string
}

export function EnhancedEventCard({
    children,
    eventDate,
    isPriority = false,
    isCancelled = false,
    className,
}: EnhancedEventCardProps) {
    const eventIsPast = isPast(parseISO(eventDate))

    return (
        <Card
            className={cn(
                "h-full event-card-hover min-w-0 w-full overflow-hidden",
                eventIsPast || isCancelled ? "opacity-60" : "",
                className
            )}
        >
            {children}
        </Card>
    )
}
