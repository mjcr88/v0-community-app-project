"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, HelpCircle, X, Users, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { rsvpToEvent, getUserRsvpStatus, getEventRsvpCounts } from "@/app/actions/events"
import { toast } from "sonner"

interface EventRsvpSectionProps {
  eventId: string
  tenantId: string
  requiresRsvp: boolean
  rsvpDeadline: string | null
  maxAttendees: number | null
  userId: string | null
}

export function EventRsvpSection({
  eventId,
  tenantId,
  requiresRsvp,
  rsvpDeadline,
  maxAttendees,
  userId,
}: EventRsvpSectionProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [counts, setCounts] = useState({ yes: 0, maybe: 0, no: 0 })
  const [isLoading, setIsLoading] = useState(false)

  // Check if RSVP deadline has passed
  const isDeadlinePassed = rsvpDeadline ? new Date(rsvpDeadline) < new Date() : false

  // Check if event is full
  const totalAttending = counts.yes
  const isFull = maxAttendees ? totalAttending >= maxAttendees : false

  // User can RSVP if: authenticated, deadline not passed, and (not full OR already attending)
  const canRsvp = userId && !isDeadlinePassed && (!isFull || currentStatus === "yes")

  useEffect(() => {
    if (!userId) return

    async function loadData() {
      // Load RSVP status
      if (requiresRsvp) {
        const statusResult = await getUserRsvpStatus(eventId)
        if (statusResult.success && statusResult.data) {
          setCurrentStatus(statusResult.data.rsvp_status)
        }

        // Load RSVP counts
        const countsResult = await getEventRsvpCounts(eventId)
        if (countsResult.success && countsResult.data) {
          setCounts(countsResult.data)
        }
      }
    }

    loadData()
  }, [eventId, userId, requiresRsvp])

  async function handleRsvp(status: "yes" | "maybe" | "no") {
    if (!userId) {
      toast.error("Please sign in to RSVP")
      return
    }

    setIsLoading(true)
    const result = await rsvpToEvent(eventId, status)

    if (result.success) {
      setCurrentStatus(status)
      const statusLabel = status === "yes" ? "Attending" : status === "maybe" ? "Maybe" : "Not Attending"
      toast.success(`RSVP updated: ${statusLabel}`)

      // Reload counts
      const countsResult = await getEventRsvpCounts(eventId)
      if (countsResult.success && countsResult.data) {
        setCounts(countsResult.data)
      }

      router.refresh()
    } else {
      toast.error(result.error || "Failed to update RSVP")
    }

    setIsLoading(false)
  }

  if (!requiresRsvp) {
    return null
  }

  return (
    <div className="p-6 border rounded-lg bg-card space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">RSVP</h3>
        </div>

        {/* Attendee Counts */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              {counts.yes} Attending
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="gap-1">
              <HelpCircle className="h-3 w-3" />
              {counts.maybe} Maybe
            </Badge>
          </div>

          {/* Capacity Indicator */}
          {maxAttendees && (
            <Badge variant={isFull ? "destructive" : "default"}>
              {counts.yes}/{maxAttendees} spots {isFull && "• Full"}
            </Badge>
          )}
        </div>

        {/* RSVP Deadline */}
        {rsvpDeadline && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              RSVP by{" "}
              {new Date(rsvpDeadline).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            {isDeadlinePassed && <Badge variant="destructive">Deadline Passed</Badge>}
          </div>
        )}
      </div>

      {/* RSVP Buttons */}
      {userId ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={currentStatus === "yes" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRsvp("yes")}
            disabled={isLoading || !canRsvp}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Attending
          </Button>
          <Button
            variant={currentStatus === "maybe" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRsvp("maybe")}
            disabled={isLoading || isDeadlinePassed}
            className="gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Maybe
          </Button>
          <Button
            variant={currentStatus === "no" ? "destructive" : "outline"}
            size="sm"
            onClick={() => handleRsvp("no")}
            disabled={isLoading || isDeadlinePassed}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Not Attending
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Please sign in to RSVP to this event</p>
      )}

      {/* Status Messages */}
      {isFull && currentStatus !== "yes" && <p className="text-sm text-destructive">This event is at full capacity</p>}
    </div>
  )
}
