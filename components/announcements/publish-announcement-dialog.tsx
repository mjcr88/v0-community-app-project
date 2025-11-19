"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
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
import { Send } from 'lucide-react'
import { publishAnnouncement } from "@/app/actions/announcements"
import { useToast } from "@/hooks/use-toast"

interface PublishAnnouncementDialogProps {
  announcementId: string
  tenantSlug: string
  tenantId: string
  trigger?: React.ReactNode
}

export function PublishAnnouncementDialog({
  announcementId,
  tenantSlug,
  tenantId,
  trigger,
}: PublishAnnouncementDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handlePublish() {
    setIsPublishing(true)
    try {
      const result = await publishAnnouncement(announcementId, tenantSlug, tenantId)

      if (result.success) {
        toast({
          title: "Announcement published",
          description: "Notifications have been sent to residents.",
        })
        setOpen(false)
        router.refresh()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to publish announcement",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Send className="mr-2 h-4 w-4" />
            Publish
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish Announcement?</AlertDialogTitle>
          <AlertDialogDescription>
            This will make the announcement visible to residents and send notifications immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPublishing}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => {
            e.preventDefault()
            handlePublish()
          }} disabled={isPublishing}>
            {isPublishing ? "Publishing..." : "Publish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
