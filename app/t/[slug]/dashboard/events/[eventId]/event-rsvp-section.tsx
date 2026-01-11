"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRioFeedback } from "@/components/feedback/rio-feedback-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, HelpCircle, X, Users, Clock, AlertCircle } from "lucide-react"
import { rsvpToEvent, getUserRsvpStatus, getEventRsvpCounts } from "@/app/actions/events"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface EventRsvpSectionProps {
  eventId: string
  tenantId: string
  requiresRsvp: boolean
  rsvpDeadline: string | null
  maxAttendees: number | null
  userId: string | null
  eventStatus?: "draft" | "published" | "cancelled"
  parentEventId?: string | null
  recurrenceRule?: any
}

export function EventRsvpSection({
  eventId,
  tenantId,
  requiresRsvp,
  rsvpDeadline,
  maxAttendees,
  userId,
  eventStatus,
  parentEventId,
  recurrenceRule,
}: EventRsvpSectionProps) {
  const router = useRouter()
  const { showFeedback } = useRioFeedback()
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [counts, setCounts] = useState({ yes: 0, maybe: 0, no: 0 })
  const [isLoading, setIsLoading] = useState(false)

  // Series RSVP State
  const [isScopeDialogOpen, setIsScopeDialogOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<"yes" | "maybe" | "no" | null>(null)
  const [rsvpScope, setRsvpScope] = useState<"this" | "series">("this")

  const isSeriesEvent = !!parentEventId || !!recurrenceRule
  const isCancelled = eventStatus === "cancelled"

  // Check if RSVP deadline has passed
  const isDeadlinePassed = rsvpDeadline ? new Date(rsvpDeadline) < new Date() : false

  // Check if event is full
  const totalAttending = counts.yes
  const isFull = maxAttendees ? totalAttending >= maxAttendees : false

  // User can RSVP if: authenticated, deadline not passed, and (not full OR already attending), and NOT cancelled
  const canRsvp = userId && !isDeadlinePassed && (!isFull || currentStatus === "yes") && !isCancelled

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

  async function handleRsvpClick(status: "yes" | "maybe" | "no") {
    if (!userId) {
      showFeedback({
        title: "Sign in required",
        description: "Please sign in to RSVP to this event.",
        variant: "error",
        image: "/rio/rio_no_results_confused.png"
      })
      return
    }

    if (isSeriesEvent) {
      setPendingStatus(status)
      setRsvpScope("this") // Reset to default
      setIsScopeDialogOpen(true)
    } else {
      submitRsvp(status, "this")
    }
  }

  async function submitRsvp(status: "yes" | "maybe" | "no", scope: "this" | "series") {
    setIsLoading(true)
    const result = await rsvpToEvent(eventId, tenantId, status, scope)

    if (result.success) {
      setCurrentStatus(status)
      const statusLabel = status === "yes" ? "Attending" : status === "maybe" ? "Maybe" : "Not Attending"
      const scopeLabel = scope === "series" ? " for this and all future events" : ""

      showFeedback({
        title: status === "yes" ? "You're going!" : "RSVP Updated",
        description: status === "yes"
          ? `Your RSVP has been confirmed${scopeLabel}. We've added this to your calendar.`
          : `You've marked your status as ${statusLabel}${scopeLabel}.`,
        variant: "success",
        image: "/rio/rio_rsvp_celebration.png"
      })

      // Reload counts
      const countsResult = await getEventRsvpCounts(eventId)
      if (countsResult.success && countsResult.data) {
        setCounts(countsResult.data)
      }

      router.refresh()
    } else {
      showFeedback({
        title: "Couldn't update RSVP",
        description: result.error || "Something went wrong. Please try again.",
        variant: "error",
        image: "/rio/rio_no_results_confused.png"
      })
    }

    setIsLoading(false)
    setIsScopeDialogOpen(false)
    setPendingStatus(null)
  }

  if (!requiresRsvp) {
    return null
  }

  return (
    <>
      <div className={`p-6 border rounded-lg space-y-4 ${isCancelled ? "bg-muted/50 opacity-60" : "bg-card"}`}>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">RSVP</h3>
          </div>

          {isCancelled && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>RSVPs are closed for cancelled events</span>
            </div>
          )}

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
        {userId && !isCancelled ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={currentStatus === "yes" ? "default" : "outline"}
              size="sm"
              onClick={() => handleRsvpClick("yes")}
              disabled={isLoading || !canRsvp}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Attending
            </Button>
            <Button
              variant={currentStatus === "maybe" ? "default" : "outline"}
              size="sm"
              onClick={() => handleRsvpClick("maybe")}
              disabled={isLoading || isDeadlinePassed}
              className="gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Maybe
            </Button>
            <Button
              variant={currentStatus === "no" ? "destructive" : "outline"}
              size="sm"
              onClick={() => handleRsvpClick("no")}
              disabled={isLoading || isDeadlinePassed}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Not Attending
            </Button>
          </div>
        ) : !userId ? (
          <p className="text-sm text-muted-foreground">Please sign in to RSVP to this event</p>
        ) : null}

        {/* Status Messages */}
        {!isCancelled && isFull && currentStatus !== "yes" && (
          <p className="text-sm text-destructive">This event is at full capacity</p>
        )}
      </div>

      <Dialog open={isScopeDialogOpen} onOpenChange={setIsScopeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update RSVP</DialogTitle>
            <DialogDescription>
              This event is part of a series. How would you like to apply your RSVP?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <RadioGroup value={rsvpScope} onValueChange={(val: "this" | "series") => setRsvpScope(val)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="this" id="r-this" />
                <Label htmlFor="r-this">This event only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="series" id="r-series" />
                <Label htmlFor="r-series">This and all future events</Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScopeDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => pendingStatus && submitRsvp(pendingStatus, rsvpScope)} disabled={isLoading}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
