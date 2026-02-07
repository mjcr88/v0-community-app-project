"use client"

import { Button } from "@/components/ui/button"
import { Check, Heart, X, HelpCircle, CalendarDays, Calendar } from "lucide-react"
import { rsvpToEvent, saveEvent, unsaveEvent } from "@/app/actions/events"
import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { NumberTicker } from "@/components/library/number-ticker"
import { EventsAnalytics } from "@/lib/analytics"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { useSWRConfig } from "swr"
import { cn } from "@/lib/utils"

interface EventRsvpQuickActionProps {
  eventId: string
  tenantId: string
  userId: string | null
  currentRsvpStatus?: "yes" | "maybe" | "no" | null
  isSaved?: boolean
  requiresRsvp?: boolean
  maxAttendees?: number | null
  currentAttendeeCount?: number
  rsvpDeadline?: string | null
  isSeries?: boolean
  parentEventId?: string | null
  startDate?: string | null
}

export function EventRsvpQuickAction({
  eventId,
  tenantId,
  userId,
  currentRsvpStatus,
  isSaved = false,
  requiresRsvp = false,
  maxAttendees,
  currentAttendeeCount = 0,
  rsvpDeadline,
  isSeries = false,
  parentEventId,
  startDate
}: EventRsvpQuickActionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localRsvpStatus, setLocalRsvpStatus] = useState(currentRsvpStatus)
  const [localIsSaved, setLocalIsSaved] = useState(isSaved)
  const [localAttendeeCount, setLocalAttendeeCount] = useState(currentAttendeeCount)
  const [showSeriesDialog, setShowSeriesDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<"yes" | "maybe" | "no" | null>(null)
  const { mutate } = useSWRConfig()

  // Cross-card synchronization for event series
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{
        seriesId: string
        status: "yes" | "maybe" | "no" | null
        startDate: string
      }>
      const { seriesId, status, startDate: syncDate } = customEvent.detail
      const currentSeriesId = parentEventId || eventId

      // If it's the same series AND this event is in the future relative to the sync
      if (seriesId === currentSeriesId && startDate && syncDate && startDate >= syncDate) {
        // Only update if the status is actually different
        if (localRsvpStatus !== status) {
          const previousStatus = localRsvpStatus
          setLocalRsvpStatus(status)

          // Also update count optimistically for this sibling card
          if (status === "yes" && previousStatus !== "yes") {
            setLocalAttendeeCount(prev => prev + 1)
          } else if (status !== "yes" && previousStatus === "yes") {
            setLocalAttendeeCount(prev => Math.max(0, prev - 1))
          }
        }
      }
    }

    window.addEventListener('rio-series-rsvp-sync', handleSync)
    return () => window.removeEventListener('rio-series-rsvp-sync', handleSync)
  }, [eventId, parentEventId, startDate, localRsvpStatus])

  if (!userId) return null

  const isEventFull =
    maxAttendees !== null &&
    maxAttendees !== undefined &&
    currentAttendeeCount >= maxAttendees &&
    localRsvpStatus !== "yes"

  const isDeadlinePassed = rsvpDeadline ? new Date(rsvpDeadline) < new Date() : false

  const handleRsvp = async (status: "yes" | "maybe" | "no", scope: "this" | "series" = "this") => {
    if (isEventFull || isDeadlinePassed) return

    setShowSeriesDialog(false) // Close dialog if open

    // Optimistic update for local UI - OUTSIDE startTransition for max priority
    const previousStatus = localRsvpStatus
    const previousCount = localAttendeeCount

    setLocalRsvpStatus(status)

    // Update attendee count optimistically
    if (status === "yes" && previousStatus !== "yes") {
      setLocalAttendeeCount(prev => prev + 1)
    } else if (status !== "yes" && previousStatus === "yes") {
      setLocalAttendeeCount(prev => Math.max(0, prev - 1))
    }

    startTransition(async () => {
      const result = await rsvpToEvent(eventId, tenantId, status, scope)
      if (result.success) {
        EventsAnalytics.rsvp(eventId, status)
        // Mutate global event keys to update other widgets (Dashboard, etc.)
        mutate((key) => typeof key === 'string' && key.startsWith(`/api/events/upcoming/${tenantId}`), undefined, { revalidate: true })

        // Also mutate priority feed since RSVP changes affect it
        mutate('/api/dashboard/priority')

        // Dispatch sync event for other cards on the page if this was a series RSVP
        if (scope === "series") {
          const syncEvent = new CustomEvent('rio-series-rsvp-sync', {
            detail: {
              seriesId: parentEventId || eventId,
              status,
              startDate: startDate || ""
            }
          })
          window.dispatchEvent(syncEvent)
        }

        router.refresh()
        const scopeText = scope === 'series' ? 'this and future events' : 'this event'
        toast({
          title: "RSVP updated",
          description: `You've marked yourself as ${status === "yes" ? "attending" : status === "maybe" ? "maybe attending" : "not attending"} for ${scopeText}`,
        })
      } else {
        // Rollback
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

  const onRsvpClick = (status: "yes" | "maybe" | "no", e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isSeries) {
      setPendingStatus(status)
      setShowSeriesDialog(true)
    } else {
      handleRsvp(status, "this")
    }
  }

  const handleSave = async () => {
    const previousIsSaved = localIsSaved
    setLocalIsSaved(!previousIsSaved)

    startTransition(async () => {
      if (previousIsSaved) {
        const result = await unsaveEvent(eventId, tenantId)
        if (result.success) {
          EventsAnalytics.unsaved(eventId)
          // Mutate priority feed since saving changes affect it
          mutate('/api/dashboard/priority')
          router.refresh()
          toast({
            title: "Event removed",
            description: "Event removed from your saved list",
          })
        } else {
          setLocalIsSaved(true) // rollback
          toast({
            title: "Error",
            description: "Could not unsave event",
            variant: "destructive"
          })
        }
      } else {
        const result = await saveEvent(eventId, tenantId)
        if (result.success) {
          EventsAnalytics.saved(eventId)
          // Mutate priority feed since saving changes affect it
          mutate('/api/dashboard/priority')
          router.refresh()
          toast({
            title: "Event saved",
            description: "Event saved to your list",
          })
        } else {
          setLocalIsSaved(false) // rollback
          toast({
            title: "Error",
            description: "Could not save event",
            variant: "destructive"
          })
        }
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap min-w-0" onClick={(e) => e.stopPropagation()}>
        {/* Save Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSave()
          }}
          disabled={isPending}
          className="h-8 w-8 p-0 flex-shrink-0"
          title={localIsSaved ? "Unsave event" : "Save event"}
        >
          <Heart className={`h-4 w-4 ${localIsSaved ? "fill-current text-red-500 heart-bounce" : ""}`} />
        </Button>

        {/* RSVP Buttons - only show if RSVP is enabled */}
        {requiresRsvp && (
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => onRsvpClick("yes", e)}
              disabled={isDeadlinePassed}
              className={cn(
                "h-8 w-8 p-0 flex-shrink-0 transition-all duration-200",
                localRsvpStatus === "yes"
                  ? "bg-primary text-primary-foreground shadow-sm scale-110 hover:bg-primary/90"
                  : "hover:bg-primary/10 hover:text-primary",
                isPending && localRsvpStatus === "yes" && "opacity-100 animate-pulse" // Keep visibility during merge
              )}
              title="Attending"
            >
              <Check className={cn("h-4 w-4", localRsvpStatus === "yes" && "stroke-[3px]")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => onRsvpClick("maybe", e)}
              disabled={isDeadlinePassed}
              className={cn(
                "h-8 w-8 p-0 flex-shrink-0 transition-all duration-200",
                localRsvpStatus === "maybe"
                  ? "bg-secondary text-secondary-foreground shadow-sm scale-110 hover:bg-secondary/90"
                  : "hover:bg-secondary/10 hover:text-secondary",
                isPending && localRsvpStatus === "maybe" && "opacity-100 animate-pulse"
              )}
              title="Maybe"
            >
              <HelpCircle className={cn("h-4 w-4", localRsvpStatus === "maybe" && "stroke-[3px]")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => onRsvpClick("no", e)}
              disabled={isDeadlinePassed}
              className={cn(
                "h-8 w-8 p-0 flex-shrink-0 transition-all duration-200",
                localRsvpStatus === "no"
                  ? "bg-destructive text-destructive-foreground shadow-sm scale-110 hover:bg-destructive/90"
                  : "hover:bg-destructive/10 hover:text-destructive",
                isPending && localRsvpStatus === "no" && "opacity-100 animate-pulse"
              )}
              title="Not Attending"
            >
              <X className={cn("h-4 w-4", localRsvpStatus === "no" && "stroke-[3px]")} />
            </Button>

            {/* Attendance Count */}
            <div className="flex items-center gap-0.5 text-xs text-muted-foreground mr-1">
              <NumberTicker
                value={localAttendeeCount}
                className={cn(
                  "text-xs font-semibold px-1 rounded-sm transition-colors",
                  localRsvpStatus === "yes" ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}
              />
              {maxAttendees && (
                <span className="text-xs">/{maxAttendees}</span>
              )}
              <span className="text-xs ml-0.5">going</span>
            </div>
          </div>
        )}
      </div>

      <ResponsiveDialog
        isOpen={showSeriesDialog}
        setIsOpen={setShowSeriesDialog}
        title="RSVP to Series"
        description="This event is part of a recurring series. How would you like to RSVP?"
        className="px-0 sm:px-6" // Remove padding on mobile drawer body to control it manually
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

        {/* Footer actions for Desktop Dialog only - Drawer has its own footer in ResponsiveDialog */}
        <div className="hidden sm:flex sm:justify-end sm:gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowSeriesDialog(false)}>
            Cancel
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  )
}
