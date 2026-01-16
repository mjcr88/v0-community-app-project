"use client"

import { Button } from "@/components/ui/button"
import { Check, Heart, X, HelpCircle } from "lucide-react"
import { rsvpToEvent, saveEvent, unsaveEvent } from "@/app/actions/events"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { NumberTicker } from "@/components/library/number-ticker"
import { EventsAnalytics } from "@/lib/analytics"

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
}: EventRsvpQuickActionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localRsvpStatus, setLocalRsvpStatus] = useState(currentRsvpStatus)
  const [localIsSaved, setLocalIsSaved] = useState(isSaved)

  if (!userId) return null

  const isEventFull =
    maxAttendees !== null &&
    maxAttendees !== undefined &&
    currentAttendeeCount >= maxAttendees &&
    localRsvpStatus !== "yes"

  const isDeadlinePassed = rsvpDeadline ? new Date(rsvpDeadline) < new Date() : false

  const handleRsvp = async (status: "yes" | "maybe" | "no") => {
    if (isEventFull || isDeadlinePassed) return

    startTransition(async () => {
      const result = await rsvpToEvent(eventId, tenantId, status)
      if (result.success) {
        setLocalRsvpStatus(status)
        EventsAnalytics.rsvp(eventId, status)
        router.refresh()
        toast({
          title: "RSVP updated",
          description: `You've marked yourself as ${status === "yes" ? "attending" : status === "maybe" ? "maybe attending" : "not attending"}`,
        })
      } else {
        toast({
          title: "RSVP failed",
          description: result.error || "Failed to update RSVP",
          variant: "destructive",
        })
      }
    })
  }

  const handleSave = async () => {
    startTransition(async () => {
      if (localIsSaved) {
        const result = await unsaveEvent(eventId, tenantId)
        if (result.success) {
          setLocalIsSaved(false)
          EventsAnalytics.unsaved(eventId)
          router.refresh()
          toast({
            title: "Event removed",
            description: "Event removed from your saved list",
          })
        }
      } else {
        const result = await saveEvent(eventId, tenantId)
        if (result.success) {
          setLocalIsSaved(true)
          EventsAnalytics.saved(eventId)
          router.refresh()
          toast({
            title: "Event saved",
            description: "Event saved to your list",
          })
        }
      }
    })
  }

  return (
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
        <>
          <Button
            variant={localRsvpStatus === "yes" ? "default" : "ghost"}
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleRsvp("yes")
            }}
            disabled={isPending || isEventFull || isDeadlinePassed}
            className="h-8 w-8 p-0 flex-shrink-0"
            title="Attending"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant={localRsvpStatus === "maybe" ? "default" : "ghost"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleRsvp("maybe")
            }}
            disabled={isPending || isDeadlinePassed}
            className="h-8 w-8 p-0 flex-shrink-0"
            title="Maybe"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant={localRsvpStatus === "no" ? "default" : "ghost"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleRsvp("no")
            }}
            disabled={isPending || isDeadlinePassed}
            className="h-8 w-8 p-0 flex-shrink-0"
            title="Not Attending"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Attendance Count */}
          <div className="flex items-center gap-0.5 text-xs text-muted-foreground flex-shrink-0">
            <NumberTicker value={currentAttendeeCount} className="text-xs" />
            {maxAttendees && (
              <span className="text-xs">/{maxAttendees}</span>
            )}
            <span className="text-xs ml-1">going</span>
          </div>
        </>
      )}
    </div>
  )
}
