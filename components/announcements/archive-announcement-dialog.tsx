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
import { Archive } from 'lucide-react'
import { archiveAnnouncements } from "@/app/actions/announcements"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

export function ArchiveAnnouncementDialog({
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

  const handleArchive = async () => {
    setIsProcessing(true)
    try {
      const result = await archiveAnnouncements(announcementIds, tenantId, tenantSlug)
      if (result.success) {
        toast.success(`${announcementIds.length} announcement(s) archived successfully`)
        router.push(`/t/${tenantSlug}/admin/announcements`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to archive announcements")
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
        <Button variant="outline" size="sm">
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Archive {announcementIds.length} announcement{announcementIds.length > 1 ? "s" : ""}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Archived announcements will still be visible to residents in their archived tab.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleArchive} disabled={isProcessing}>
            {isProcessing ? "Archiving..." : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
