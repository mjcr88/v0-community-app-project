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
import { Archive } from 'lucide-react'
import { archiveAnnouncement } from "@/app/actions/announcements"
import { useToast } from "@/hooks/use-toast"

interface ArchiveAnnouncementDialogProps {
  announcementId: string
  tenantSlug: string
  tenantId: string
  trigger?: React.ReactNode
  redirectAfter?: boolean
}

export function ArchiveAnnouncementDialog({
  announcementId,
  tenantSlug,
  tenantId,
  trigger,
  redirectAfter = false,
}: ArchiveAnnouncementDialogProps) {
  const [open, setOpen] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleArchive() {
    setIsArchiving(true)
    try {
      const result = await archiveAnnouncement(announcementId, tenantSlug, tenantId)

      if (result.success) {
        toast({
          title: "Announcement archived",
          description: "The announcement has been moved to the archive.",
        })
        setOpen(false)
        
        if (redirectAfter) {
          router.push(`/t/${tenantSlug}/admin/announcements`)
        } else {
          router.refresh()
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to archive announcement",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Announcement?</AlertDialogTitle>
          <AlertDialogDescription>
            This will move the announcement to the archive. Residents will still be able to view it in their archived
            tab.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => {
            e.preventDefault()
            handleArchive()
          }} disabled={isArchiving}>
            {isArchiving ? "Archiving..." : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
