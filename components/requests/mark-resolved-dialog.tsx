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
import { CheckCircle } from 'lucide-react'
import { updateRequestStatus } from "@/app/actions/resident-requests"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

interface MarkResolvedDialogProps {
  requestIds: string[]
  requestTitle?: string
  tenantId: string
  tenantSlug: string
}

export function MarkResolvedDialog({
  requestIds,
  requestTitle,
  tenantId,
  tenantSlug,
}: MarkResolvedDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleMarkResolved = async () => {
    startTransition(async () => {
      try {
        let successCount = 0
        let failCount = 0

        for (const requestId of requestIds) {
          const result = await updateRequestStatus(requestId, tenantId, tenantSlug, 'resolved')
          if (result.success) {
            successCount++
          } else {
            failCount++
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} request${successCount > 1 ? "s" : ""} marked as resolved`)
        }
        if (failCount > 0) {
          toast.error(`Failed to resolve ${failCount} request${failCount > 1 ? "s" : ""}`)
        }

        setOpen(false)
        router.refresh()
      } catch (error) {
        toast.error("An unexpected error occurred")
      }
    })
  }

  const title = requestIds.length === 1 && requestTitle 
    ? `Mark "${requestTitle}" as resolved?`
    : `Mark ${requestIds.length} request(s) as resolved?`

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CheckCircle className="mr-2 h-4 w-4" />
          Resolve
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the request(s) as resolved and notify the resident(s).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleMarkResolved} disabled={isPending}>
            {isPending ? "Resolving..." : "Mark Resolved"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
