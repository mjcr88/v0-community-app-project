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
import { Flag } from "lucide-react"
import { flagEvent } from "@/app/actions/events"
import { toast } from "sonner"

interface FlagEventDialogProps {
  eventId: string
  tenantSlug: string
  triggerLabel?: string
  triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  triggerSize?: "default" | "sm" | "lg" | "icon"
  disabled?: boolean
  initialFlagCount: number
  initialHasUserFlagged: boolean
  customTrigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function FlagEventDialog({
  eventId,
  tenantSlug,
  triggerLabel = "Flag Event",
  triggerVariant = "outline",
  triggerSize = "default",
  disabled = false,
  initialFlagCount,
  initialHasUserFlagged,
  customTrigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: FlagEventDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [localFlagCount, setLocalFlagCount] = useState(initialFlagCount)
  const [localHasUserFlagged, setLocalHasUserFlagged] = useState(initialHasUserFlagged)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (reason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters")
      return
    }

    if (reason.trim().length > 500) {
      toast.error("Reason must be less than 500 characters")
      return
    }

    startTransition(async () => {
      const result = await flagEvent(eventId, reason, tenantSlug)

      if (result.success) {
        toast.success("Event flagged. Admins will review.", {
          duration: 5000,
        })

        setLocalFlagCount((prev) => prev + 1)
        setLocalHasUserFlagged(true)

        setOpen(false)
        setReason("")

        setTimeout(() => {
          router.refresh()
        }, 500)
      } else {
        toast.error(result.error || "Failed to flag event. Please try again.", {
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
          <Button
            variant={triggerVariant}
            size={triggerSize}
            disabled={disabled || localHasUserFlagged}
            className="gap-2"
          >
            <Flag className="h-4 w-4" />
            {localHasUserFlagged ? "Flagged" : triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Flag Event</DialogTitle>
            <DialogDescription>
              Help keep our community safe. Please provide a reason for flagging this event.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Inappropriate content, Spam, Incorrect information..."
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
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isPending}>
              {isPending ? "Submitting..." : "Submit Flag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
