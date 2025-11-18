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
import { Send } from 'lucide-react'
import { publishAnnouncements } from "@/app/actions/announcements"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

export function PublishAnnouncementDialog({
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

  const handlePublish = async () => {
    setIsProcessing(true)
    try {
      const result = await publishAnnouncements(announcementIds, tenantId, tenantSlug)
      if (result.success) {
        toast.success(`${announcementIds.length} announcement(s) published successfully`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to publish announcements")
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
        <Button size="sm">
          <Send className="mr-2 h-4 w-4" />
          Publish
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Publish {announcementIds.length} announcement{announcementIds.length > 1 ? "s" : ""}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will send notifications to all targeted residents and make the announcement
            {announcementIds.length > 1 ? "s" : ""} visible in the community.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handlePublish} disabled={isProcessing}>
            {isProcessing ? "Publishing..." : "Publish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
