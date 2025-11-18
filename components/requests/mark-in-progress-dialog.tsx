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
import { Clock } from 'lucide-react'
import { updateRequestStatus } from "@/app/actions/resident-requests"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

interface MarkInProgressDialogProps {
  requestIds: string[]
  requestTitle?: string
  tenantId: string
  tenantSlug: string
}

export function MarkInProgressDialog({
  requestIds,
  requestTitle,
  tenantId,
  tenantSlug,
}: MarkInProgressDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleMarkInProgress = async () => {
    startTransition(async () => {
      try {
        let successCount = 0
        let failCount = 0

        for (const requestId of requestIds) {
          const result = await updateRequestStatus(requestId, tenantId, tenantSlug, 'in_progress')
          if (result.success) {
            successCount++
          } else {
            failCount++
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} request${successCount > 1 ? "s" : ""} marked as in progress`)
        }
        if (failCount > 0) {
          toast.error(`Failed to update ${failCount} request${failCount > 1 ? "s" : ""}`)
        }

        setOpen(false)
        router.refresh()
      } catch (error) {
        toast.error("An unexpected error occurred")
      }
    })
  }

  const title = requestIds.length === 1 && requestTitle 
    ? `Mark "${requestTitle}" as in progress?`
    : `Mark ${requestIds.length} request(s) as in progress?`

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="mr-2 h-4 w-4" />
          In Progress
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            This will change the status to "In Progress" and notify the resident(s).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleMarkInProgress} disabled={isPending}>
            {isPending ? "Updating..." : "Mark In Progress"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
