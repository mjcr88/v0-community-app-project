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
import { Trash2 } from 'lucide-react'
import { deleteAnnouncement } from "@/app/actions/announcements"
import { useToast } from "@/hooks/use-toast"

interface DeleteAnnouncementDialogProps {
  announcementId: string
  tenantSlug: string
  tenantId: string
  trigger?: React.ReactNode
  redirectAfter?: boolean
}

export function DeleteAnnouncementDialog({
  announcementId,
  tenantSlug,
  tenantId,
  trigger,
  redirectAfter = false,
}: DeleteAnnouncementDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteAnnouncement(announcementId, tenantSlug, tenantId)

      if (result.success) {
        toast({
          title: "Announcement deleted",
          description: "The announcement has been permanently deleted.",
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
          description: result.error || "Failed to delete announcement",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the announcement and remove it from all residents'
            views.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
