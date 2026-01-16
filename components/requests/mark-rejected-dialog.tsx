"use client"

import { useState, useTransition } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { XCircle } from 'lucide-react'
import { updateRequestStatus } from "@/app/actions/resident-requests"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import { RequestsAnalytics } from "@/lib/analytics"

interface MarkRejectedDialogProps {
  requestIds: string[]
  requestTitle?: string
  tenantId: string
  tenantSlug: string
}

export function MarkRejectedDialog({
  requestIds,
  requestTitle,
  tenantId,
  tenantSlug,
}: MarkRejectedDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleMarkRejected = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }

    if (reason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters")
      return
    }

    startTransition(async () => {
      try {
        let successCount = 0
        let failCount = 0

        for (const requestId of requestIds) {
          const result = await updateRequestStatus(requestId, tenantId, tenantSlug, 'rejected', reason)
          if (result.success) {
            RequestsAnalytics.updated(requestId, 'rejected')
            successCount++
          } else {
            failCount++
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} request${successCount > 1 ? "s" : ""} rejected`)
        }
        if (failCount > 0) {
          toast.error(`Failed to reject ${failCount} request${failCount > 1 ? "s" : ""}`)
        }

        setOpen(false)
        setReason("")
        router.refresh()
      } catch (error) {
        toast.error("An unexpected error occurred")
      }
    })
  }

  const title = requestIds.length === 1 && requestTitle
    ? `Reject "${requestTitle}"?`
    : `Reject ${requestIds.length} request(s)?`

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            Please provide a reason for rejecting this request. The resident(s) will be notified.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="reject-reason">Reason for rejection *</Label>
          <Textarea
            id="reject-reason"
            placeholder="e.g., Cannot be completed at this time, Needs more information, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2"
            rows={3}
            disabled={isPending}
          />
          <p className="text-sm text-muted-foreground mt-2">
            This reason will be visible to the resident(s).
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleMarkRejected}
            disabled={isPending || !reason.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Rejecting..." : "Reject"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
