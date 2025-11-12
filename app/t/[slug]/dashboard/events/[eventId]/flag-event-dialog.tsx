"use client"

import { useState } from "react"
import { Flag } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { flagEvent } from "@/app/actions/events"
import { useRouter } from "next/navigation"

interface FlagEventDialogProps {
  eventId: string
  tenantId: string
  tenantSlug: string
  eventTitle: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function FlagEventDialog({
  eventId,
  tenantId,
  tenantSlug,
  eventTitle,
  variant = "outline",
  size = "sm",
  className,
}: FlagEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for flagging this event.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const result = await flagEvent(eventId, tenantId, tenantSlug, reason)

    setIsSubmitting(false)

    if (result.success) {
      toast({
        title: "Event flagged",
        description: "This event has been flagged for admin review. Thank you for helping keep our community safe.",
      })
      setOpen(false)
      setReason("")
      router.refresh()
    } else {
      toast({
        title: "Failed to flag event",
        description: result.error || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Flag className="h-4 w-4 mr-2" />
          Flag Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Flag Event for Review</DialogTitle>
          <DialogDescription>
            Please let us know why you're flagging "{eventTitle}". This will alert community admins to review the event.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for flagging *</Label>
            <Textarea
              id="reason"
              placeholder="Please describe why this event should be reviewed (e.g., inappropriate content, incorrect information, spam, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              disabled={isSubmitting}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Your report will be reviewed by community administrators. All flags are anonymous to other residents.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting ? "Flagging..." : "Flag Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
