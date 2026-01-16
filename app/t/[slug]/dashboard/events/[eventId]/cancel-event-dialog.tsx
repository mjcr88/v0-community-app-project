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

interface CancelEventDialogProps {
  eventId: string
  tenantSlug: string
  eventTitle: string
  triggerSize?: "default" | "sm" | "lg" | "icon"
  customTrigger?: React.ReactNode
}

export function CancelEventDialog({ eventId, tenantSlug, eventTitle, triggerSize = "sm", customTrigger }: CancelEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (reason.trim().length < 10) {
      toast.error("Cancellation reason must be at least 10 characters")
      return
    }

    if (reason.trim().length > 500) {
      toast.error("Cancellation reason must be less than 500 characters")
      return
    }

    startTransition(async () => {
      const result = await cancelEvent(eventId, tenantSlug, reason)

      if (result.success) {
        EventsAnalytics.cancelled(eventId)
        toast.success("Event has been cancelled", {
          duration: 5000,
        })

        setOpen(false)
        setReason("")

        setTimeout(() => {
          router.refresh()
        }, 500)
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
    <Dialog open={open} onOpenChange={setOpen}>
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
              {isPending ? "Cancelling..." : "Cancel Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
