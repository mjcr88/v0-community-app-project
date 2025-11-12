"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Flag, Users, Lock } from "lucide-react"
import { FlagEventDialog } from "./flag-event-dialog"

interface FlagEventClientProps {
  eventId: string
  tenantSlug: string
  initialFlagCount: number
  initialHasUserFlagged: boolean
  category: any
  eventType: string
  status: string
  isPastEvent: boolean
  visibilityScope: string
}

export function FlagEventClient({
  eventId,
  tenantSlug,
  initialFlagCount,
  initialHasUserFlagged,
  category,
  eventType,
  status,
  isPastEvent,
  visibilityScope,
}: FlagEventClientProps) {
  const [flagCount, setFlagCount] = useState(initialFlagCount)
  const [hasUserFlagged, setHasUserFlagged] = useState(initialHasUserFlagged)

  const handleFlagSuccess = () => {
    setFlagCount((prev) => prev + 1)
    setHasUserFlagged(true)
  }

  const eventTypeLabel = eventType === "official" ? "Official Event" : "Community Event"
  const eventTypeVariant = eventType === "official" ? "default" : "secondary"

  const statusLabel =
    status === "cancelled" ? "Cancelled" : status === "draft" ? "Draft" : isPastEvent ? "Past Event" : "Upcoming"

  const statusVariant =
    status === "cancelled" ? "destructive" : status === "draft" ? "outline" : isPastEvent ? "secondary" : "default"

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {category?.icon && (
          <span className="text-3xl" aria-hidden="true">
            {category.icon}
          </span>
        )}
        <Badge variant="outline" className="text-sm">
          {category?.name || "Uncategorized"}
        </Badge>
        <Badge variant={eventTypeVariant as any}>{eventTypeLabel}</Badge>
        <Badge variant={statusVariant as any}>{statusLabel}</Badge>
        {flagCount > 0 && (
          <Badge variant="destructive" className="gap-1.5">
            <Flag className="h-3 w-3" />
            Flagged ({flagCount})
          </Badge>
        )}
        {visibilityScope === "neighborhood" && (
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            Neighborhood
          </Badge>
        )}
        {visibilityScope === "private" && (
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            Private
          </Badge>
        )}
      </div>

      <div className="mt-4">
        <FlagEventDialog
          eventId={eventId}
          tenantSlug={tenantSlug}
          triggerLabel={hasUserFlagged ? "Flagged" : "Flag Event"}
          triggerVariant={hasUserFlagged ? "secondary" : "outline"}
          disabled={hasUserFlagged}
          onFlagSuccess={handleFlagSuccess}
        />
      </div>
    </>
  )
}
