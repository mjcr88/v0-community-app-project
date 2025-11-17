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
import { Archive } from 'lucide-react'
import { adminArchiveListings } from "@/app/actions/exchange-listings"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

interface ArchiveListingsDialogProps {
  listingIds: string[]
  listingTitle?: string
  tenantId: string
  tenantSlug: string
  triggerSize?: "sm" | "default" | "lg" | "icon"
}

export function ArchiveListingsDialog({
  listingIds,
  listingTitle,
  tenantId,
  tenantSlug,
  triggerSize = "sm",
}: ArchiveListingsDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleArchive = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for archiving")
      return
    }

    if (reason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters")
      return
    }

    console.log("[v0] Archive started for:", listingIds)
    console.log("[v0] Reason:", reason)

    startTransition(async () => {
      try {
        const result = await adminArchiveListings(listingIds, tenantId, tenantSlug, reason)
        console.log("[v0] Archive result:", result)

        if (result.success) {
          toast.success(`${listingIds.length} listing(s) archived successfully`)
          console.log("[v0] Archive successful")
          
          setOpen(false)
          setReason("")
          router.refresh()
        } else {
          console.error("[v0] Archive failed:", result.error)
          toast.error(result.error || "Failed to archive listings")
        }
      } catch (error) {
        console.error("[v0] Unexpected error archiving:", error)
        toast.error("An unexpected error occurred")
      }
    })
  }

  const title = listingIds.length === 1 && listingTitle 
    ? `Archive "${listingTitle}"?`
    : `Archive ${listingIds.length} listing(s)?`

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size={triggerSize}>
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            Archived listings will be hidden from the exchange directory and all pending requests will be cancelled. The creator and users with pending requests will be notified.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="archive-reason">Reason for archiving *</Label>
          <Textarea
            id="archive-reason"
            placeholder="e.g., Violates community guidelines, Inappropriate content, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2"
            rows={3}
            disabled={isPending}
          />
          <p className="text-sm text-muted-foreground mt-2">
            This reason will be visible to the creator and users with pending requests.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleArchive} disabled={isPending || !reason.trim()}>
            {isPending ? "Archiving..." : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
