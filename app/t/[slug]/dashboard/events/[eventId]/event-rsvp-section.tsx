"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, HelpCircle, X, Users, Clock, AlertCircle, Calendar, CalendarDays, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { rsvpToEvent, getUserRsvpStatus, getEventRsvpCounts } from "@/app/actions/events"
import { useRioFeedback } from "@/components/feedback/rio-feedback-provider"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { useSWRConfig } from "swr"

interface EventRsvpSectionProps {
  eventId: string
  tenantId: string
  requiresRsvp: boolean
  rsvpDeadline: string | null
  maxAttendees: number | null
  userId: string | null
  eventStatus?: "draft" | "published" | "cancelled"
  initialUserStatus?: string | null
  initialCounts?: { yes: number; maybe: number; no: number }
  disableAutoFetch?: boolean
  parentEventId?: string | null
  recurrenceRule?: any | null
}

export function EventRsvpSection({
  eventId,
  tenantId,
  requiresRsvp,
  rsvpDeadline,
  maxAttendees,
  userId,
  eventStatus,
  initialUserStatus = null,
  initialCounts = { yes: 0, maybe: 0, no: 0 },
  disableAutoFetch = false,
  parentEventId,
  recurrenceRule
}: EventRsvpSectionProps) {
  const router = useRouter()
  const { showFeedback } = useRioFeedback()
  const { mutate } = useSWRConfig()
  const [isPending, startTransition] = useTransition()

  const [currentStatus, setCurrentStatus] = useState<string | null>(initialUserStatus)
  const [counts, setCounts] = useState(initialCounts)
  const [isLoading, setIsLoading] = useState(false)
  const [showSeriesDialog, setShowSeriesDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<"yes" | "maybe" | "no" | null>(null)

  const isCancelled = eventStatus === "cancelled"
  const isSeries = !!parentEventId || !!recurrenceRule

  // Check if RSVP deadline has passed
  const isDeadlinePassed = rsvpDeadline ? new Date(rsvpDeadline) < new Date() : false

  // Check if event is full
  const totalAttending = counts.yes
  const isFull = maxAttendees ? totalAttending >= maxAttendees : false

  // User can RSVP if: authenticated, deadline not passed, and (not full OR already attending), and NOT cancelled
  const canRsvp = userId && !isDeadlinePassed && (!isFull || currentStatus === "yes") && !isCancelled

  useEffect(() => {
    if (!userId || disableAutoFetch) return

    async function loadData() {
      // Load RSVP status
      if (requiresRsvp) {
        const [statusResult, countsResult] = await Promise.all([
          getUserRsvpStatus(eventId),
          getEventRsvpCounts(eventId)
        ])

        if (statusResult.success && statusResult.data) {
          setCurrentStatus(statusResult.data.rsvp_status)
        }

        if (countsResult.success && countsResult.data) {
          setCounts(countsResult.data)
        }
      }
    }

    loadData()
  }, [eventId, userId, requiresRsvp, disableAutoFetch])

  async function handleRsvp(status: "yes" | "maybe" | "no", scope: "this" | "series" = "this") {
    if (!userId) {
      showFeedback({
        title: "Sign in required",
        description: "Please sign in to RSVP to this event.",
        variant: "error",
        image: "/rio/rio_no_results_confused.png"
      })
      return
    }

    setShowSeriesDialog(false)
    setIsLoading(true)

    // Optimistic update for local UI
    const previousStatus = currentStatus
    const previousCounts = counts
    setCurrentStatus(status)

    // Optimistic update for counts
    setCounts(prev => {
      const newCounts = { ...prev }
      // Decrement old status if it was set
      if (previousStatus === 'yes') newCounts.yes--
      else if (previousStatus === 'maybe') newCounts.maybe--
      else if (previousStatus === 'no') newCounts.no--

      // Increment new status
      if (status === 'yes') newCounts.yes++
      else if (status === 'maybe') newCounts.maybe++
      else if (status === 'no') newCounts.no++

      return newCounts
    })

    startTransition(async () => {
      const result = await rsvpToEvent(eventId, tenantId, status, scope)

      if (result.success) {
        const statusLabel = status === "yes" ? "Attending" : status === "maybe" ? "Maybe" : "Not Attending"
        const scopeText = scope === 'series' ? 'this and future events' : 'this event'

        showFeedback({
          title: status === "yes" ? "You're going!" : "RSVP Updated",
          description: status === "yes"
            ? `Your RSVP has been confirmed for ${scopeText}. We've added this to your calendar.`
            : `You've marked your status as ${statusLabel} for ${scopeText}.`,
          variant: "success",
          image: "/rio/rio_rsvp_celebration.png"
        })

        // Mutate global event keys to update other widgets (Dashboard, etc.)
        mutate((key) => typeof key === 'string' && key.startsWith(`/api/events/upcoming/${tenantId}`), undefined, { revalidate: true })

        // Also mutate priority feed since RSVP changes affect it
        mutate('/api/dashboard/priority')

        // Reload counts to ensure accuracy
        const countsResult = await getEventRsvpCounts(eventId)
        if (countsResult.success && countsResult.data) {
          setCounts(countsResult.data)
        }

        router.refresh()
      } else {
        // Rollback status
        setCurrentStatus(previousStatus)
        // Rollback counts
        setCounts(previousCounts)
        showFeedback({
          title: "Couldn't update RSVP",
          description: result.error || "Something went wrong. Please try again.",
          variant: "error",
          image: "/rio/rio_no_results_confused.png"
        })
      }
      setIsLoading(false)
    })
  }

  const onRsvpClick = (status: "yes" | "maybe" | "no") => {
    if (isSeries) {
      setPendingStatus(status)
      setShowSeriesDialog(true)
    } else {
      handleRsvp(status, "this")
    }
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
              onClick={() => onRsvpClick("yes")}
              disabled={isLoading || !canRsvp}
              className="gap-2"
            >
              {isLoading && currentStatus === "yes" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Attending
            </Button>
            <Button
              variant={currentStatus === "maybe" ? "default" : "outline"}
              size="sm"
              onClick={() => onRsvpClick("maybe")}
              disabled={isLoading || isDeadlinePassed}
              className="gap-2"
            >
              {isLoading && currentStatus === "maybe" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <HelpCircle className="h-4 w-4" />
              )}
              Maybe
            </Button>
            <Button
              variant={currentStatus === "no" ? "destructive" : "outline"}
              size="sm"
              onClick={() => onRsvpClick("no")}
              disabled={isLoading || isDeadlinePassed}
              className="gap-2"
            >
              {isLoading && currentStatus === "no" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
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

      <ResponsiveDialog
        isOpen={showSeriesDialog}
        setIsOpen={setShowSeriesDialog}
        title="RSVP to Series"
        description="This event is part of a recurring series. How would you like to RSVP?"
        className="px-0 sm:px-6"
      >
        <div className="flex flex-col gap-3 py-4 px-4">
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3"
            onClick={() => pendingStatus && handleRsvp(pendingStatus, "this")}
          >
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">Just this event</span>
              <span className="text-xs text-muted-foreground">Only update RSVP for this specific date</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3"
            onClick={() => pendingStatus && handleRsvp(pendingStatus, "series")}
          >
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">This and future events</span>
              <span className="text-xs text-muted-foreground">Update RSVP for this and all following occurrences</span>
            </div>
          </Button>
        </div>

        <div className="hidden sm:flex sm:justify-end sm:gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowSeriesDialog(false)}>
            Cancel
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  )
}
