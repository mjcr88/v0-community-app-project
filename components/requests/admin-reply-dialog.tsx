"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare } from 'lucide-react'
import { addAdminReply } from "@/app/actions/resident-requests"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

interface AdminReplyDialogProps {
  requestId: string
  tenantId: string
  tenantSlug: string
  currentReply?: string | null
  currentNotes?: string | null
}

export function AdminReplyDialog({
  requestId,
  tenantId,
  tenantSlug,
  currentReply,
  currentNotes,
}: AdminReplyDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reply, setReply] = useState(currentReply || "")
  const [internalNotes, setInternalNotes] = useState(currentNotes || "")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async () => {
    if (!reply.trim()) {
      toast.error("Please enter a reply message")
      return
    }

    startTransition(async () => {
      try {
        const result = await addAdminReply(requestId, tenantId, tenantSlug, reply, internalNotes || undefined)

        if (result.success) {
          toast.success("Reply sent successfully")
          setOpen(false)
          router.refresh()
        } else {
          toast.error(result.error || "Failed to send reply")
        }
      } catch (error) {
        toast.error("An unexpected error occurred")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <MessageSquare className="mr-2 h-4 w-4" />
          {currentReply ? "Update Reply" : "Reply to Resident"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{currentReply ? "Update Reply" : "Reply to Resident"}</DialogTitle>
          <DialogDescription>
            Your reply will be visible to the resident and will change the request status to "In Progress".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="reply">Message to Resident *</Label>
            <Textarea
              id="reply"
              placeholder="e.g., We'll take care of this right away..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="mt-2"
              rows={4}
              disabled={isPending}
            />
            <p className="text-sm text-muted-foreground mt-2">
              This message will be visible to the resident.
            </p>
          </div>

          <div>
            <Label htmlFor="internal-notes">Internal Notes (Optional)</Label>
            <Textarea
              id="internal-notes"
              placeholder="Private notes for other admins..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="mt-2"
              rows={3}
              disabled={isPending}
            />
            <p className="text-sm text-muted-foreground mt-2">
              These notes are only visible to admins.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !reply.trim()}>
            {isPending ? "Sending..." : "Send Reply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
