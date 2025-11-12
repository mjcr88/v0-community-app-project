"use client"

import type React from "react"

import { useState } from "react"
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
import { Flag, AlertTriangle } from "lucide-react"
import { flagEvent } from "@/app/actions/events"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface FlagEventDialogProps {
  eventId: string
  tenantSlug: string
  triggerLabel?: string
  triggerVariant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
  disabled?: boolean
}

export function FlagEventDialog({
  eventId,
  tenantSlug,
  triggerLabel = "Flag Event",
  triggerVariant = "outline",
  disabled = false,
}: FlagEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const characterCount = reason.trim().length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedReason = reason.trim()

    // Validate reason length
    if (trimmedReason.length < 10) {
      toast.error("Reason must be at least 10 characters")
      return
    }

    if (trimmedReason.length > 500) {
      toast.error("Reason must be less than 500 characters")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("[v0] Submitting flag:", { eventId, reasonLength: trimmedReason.length })

      const result = await flagEvent(eventId, trimmedReason, tenantSlug)

      console.log("[v0] Flag result:", result)

      if (result.success) {
        toast.success("Event flagged. Admins will review.")
        setReason("")
        setOpen(false)
        window.location.reload()
      } else {
        // Handle specific error messages from server
        toast.error(result.error || "Failed to flag event. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Error flagging event:", error)
      toast.error("Failed to flag event. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm" className="gap-2" disabled={disabled}>
          <Flag className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              Flag Event
            </DialogTitle>
            <DialogDescription>
              Help keep our community safe. Please provide a reason for flagging this event.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Flag this event if it violates community guidelines
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for flagging *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Inappropriate content, Spam, Incorrect information..."
                className="min-h-[100px] resize-none"
                maxLength={500}
                required
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{characterCount < 10 ? `${10 - characterCount} more characters needed` : "Minimum met"}</span>
                <span>{characterCount} / 500</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false)
                setReason("")
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || characterCount < 10 || characterCount > 500}>
              {isSubmitting ? "Flagging..." : "Submit Flag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
