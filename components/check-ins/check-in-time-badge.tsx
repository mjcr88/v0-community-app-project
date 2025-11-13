"use client"

import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { formatTimeRemaining } from "@/lib/utils/filter-expired-checkins"
import { cn } from "@/lib/utils"

interface CheckInTimeBadgeProps {
  startTime: string
  durationMinutes: number
  className?: string
}

export function CheckInTimeBadge({ startTime, durationMinutes, className }: CheckInTimeBadgeProps) {
  const expiresAt = new Date(startTime)
  expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes)

  const now = new Date()
  const diffMs = expiresAt.getTime() - now.getTime()
  const minutesRemaining = Math.max(0, Math.floor(diffMs / 60000))

  const timeText = formatTimeRemaining(minutesRemaining)

  // Color coding based on time remaining
  const getVariant = () => {
    if (minutesRemaining > 60) return "default" // Green for >1 hour
    if (minutesRemaining > 30) return "secondary" // Yellow for 30-60 min
    return "destructive" // Red for <30 min
  }

  const isPulsing = minutesRemaining <= 15

  return (
    <Badge variant={getVariant()} className={cn("gap-1", isPulsing && "animate-pulse", className)}>
      <Clock className="h-3 w-3" />
      {timeText} left
    </Badge>
  )
}
