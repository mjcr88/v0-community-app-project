"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Ban } from "lucide-react"
import { cancelEvent } from "@/app/actions/events"
import { toast } from "sonner"
import { EventsAnalytics, ErrorAnalytics } from "@/lib/analytics"
import { useRioFeedback } from "@/components/feedback/rio-feedback-provider"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"

interface CancelEventDialogProps {
  eventId: string
  tenantSlug: string
  eventTitle: string
  triggerSize?: "default" | "sm" | "lg" | "icon"
  customTrigger?: React.ReactNode
  isSeries?: boolean
}

export function CancelEventDialog({
  eventId,
  tenantSlug,
  eventTitle,
  triggerSize = "sm",
  customTrigger,
  isSeries = false,
}: CancelEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [showScopeDialog, setShowScopeDialog] = useState(false)
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { showFeedback } = useRioFeedback()

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setReason("")
      setShowScopeDialog(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (reason.trim().length < 10) {
      toast.error("Cancellation reason must be at least 10 characters")
      return
    }

    if (reason.trim().length > 500) {
      toast.error("Cancellation reason must be less than 500 characters")
      return
    }

    if (isSeries) {
      setShowScopeDialog(true)
    } else {
      performCancellation("this")
    }
  }

  const performCancellation = async (scope: "this" | "series") => {
    setShowScopeDialog(false)
    startTransition(async () => {
      const result = await cancelEvent(eventId, tenantSlug, reason, false, scope)

      if (result.success) {
        EventsAnalytics.cancelled(eventId)

        setOpen(false)
        setReason("")

        showFeedback({
          title: scope === "series" ? "Series Cancelled" : "Event Cancelled",
          description: scope === "series"
            ? "This and all future events in the series have been cancelled."
            : "The event has been successfully cancelled and attendees will be notified.",
          variant: "success",
          image: "/rio/rio_success.png",
        })

        setTimeout(() => {
          router.push(`/t/${tenantSlug}/dashboard/events`)
          router.refresh()
        }, 1500)
      } else {
        toast.error(result.error || "Failed to cancel event. Please try again.", {
          duration: 5000,
        })
      }
    })
  }

  const characterCount = reason.trim().length
  const isValid = characterCount >= 10 && characterCount <= 500

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {customTrigger ? (
            customTrigger
          ) : (
            <Button variant="destructive" size={triggerSize} className="gap-2">
              <Ban className="h-4 w-4" />
              Cancel Event
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <DialogTitle>Cancel Event</DialogTitle>
              </div>
              <DialogDescription>
                Are you sure you want to cancel "{eventTitle}"? This will notify all attendees and prevent new RSVPs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Cancellation Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., Weather conditions, Venue unavailable, Low attendance..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isPending}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {characterCount} / 500 characters {!isValid && characterCount > 0 && "(minimum 10 characters)"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                Keep Event
              </Button>
              <Button type="submit" variant="destructive" disabled={!isValid || isPending}>
                {isPending ? "Processing..." : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ResponsiveDialog
        isOpen={showScopeDialog}
        setIsOpen={setShowScopeDialog}
        title="Cancel Recurring Event"
        description="This event is part of a series. How would you like to apply this cancellation?"
        className="px-0 sm:px-6"
      >
        <div className="flex flex-col gap-3 py-4 px-4">
          <Button variant="outline" className="justify-start gap-3 h-auto py-3" onClick={() => performCancellation("this")}>
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <Ban className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">Only this event</span>
              <span className="text-xs text-muted-foreground">Cancel only this specific occurrence</span>
            </div>
          </Button>
          <Button variant="outline" className="justify-start gap-3 h-auto py-3" onClick={() => performCancellation("series")}>
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">This and future events</span>
              <span className="text-xs text-muted-foreground">Cancel this and all following occurrences</span>
            </div>
          </Button>
        </div>
        <div className="hidden sm:flex sm:justify-end sm:gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowScopeDialog(false)}>
            Back
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  )
}
