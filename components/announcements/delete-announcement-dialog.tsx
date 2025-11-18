"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { Trash2 } from 'lucide-react'
import { deleteAnnouncements } from "@/app/actions/announcements"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

export function DeleteAnnouncementDialog({
  announcementIds,
  tenantId,
  tenantSlug,
}: {
  announcementIds: string[]
  tenantId: string
  tenantSlug: string
}) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDelete = async () => {
    setIsProcessing(true)
    try {
      const result = await deleteAnnouncements(announcementIds, tenantId, tenantSlug)
      if (result.success) {
        toast.success(`${announcementIds.length} announcement(s) deleted successfully`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to delete announcements")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {announcementIds.length} announcement{announcementIds.length > 1 ? "s" : ""}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Deleted announcements will be permanently removed and no
            longer visible to anyone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isProcessing}
            className="bg-destructive text-destructive-foreground"
          >
            {isProcessing ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
