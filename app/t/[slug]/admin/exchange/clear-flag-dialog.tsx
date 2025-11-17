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
import { FlagOff } from 'lucide-react'
import { adminUnflagListing } from "@/app/actions/exchange-listings"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

interface ClearFlagDialogProps {
  listingIds: string[]
  listingTitles: string[]
  tenantId: string
  tenantSlug: string
  triggerSize?: "sm" | "default" | "lg" | "icon"
}

export function ClearFlagDialog({
  listingIds,
  listingTitles,
  tenantId,
  tenantSlug,
  triggerSize = "sm",
}: ClearFlagDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleClearFlags = async () => {
    let allSuccess = true
    let errorMessage = ""
    
    startTransition(async () => {
      try {
        for (const listingId of listingIds) {
          const result = await adminUnflagListing(listingId, tenantId, tenantSlug, reason || undefined)

          if (!result.success) {
            allSuccess = false
            errorMessage = result.error || `Failed to clear flags for listing`
            toast.error(errorMessage)
            return
          }
        }

        if (allSuccess) {
          setOpen(false)
          setReason("")
          toast.success(`Flags cleared for ${listingIds.length} listing${listingIds.length > 1 ? "s" : ""}`)
          router.refresh()
        }
      } catch (error) {
        toast.error("An unexpected error occurred")
      }
    })
  }

  const title = listingIds.length === 1 && listingTitles[0]
    ? `Clear all flags for "${listingTitles[0]}"?`
    : `Clear flags for ${listingIds.length} listing(s)?`

  const description = listingIds.length === 1
    ? "This will remove all flags from this listing. You can optionally provide a note to the creator explaining why the flags were cleared."
    : `This will remove all flags from ${listingIds.length} selected listings. You can optionally provide a note to the creators.`

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size={triggerSize}>
          <FlagOff className="mr-2 h-4 w-4" />
          Clear Flags
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="clear-reason">Note to creator(s) (optional)</Label>
          <Textarea
            id="clear-reason"
            placeholder="e.g., After review, the listing meets community guidelines..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2"
            rows={3}
            disabled={isPending}
          />
          <p className="text-sm text-muted-foreground mt-2">
            The creator(s) will be notified that flags have been cleared.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleClearFlags} disabled={isPending}>
            {isPending ? "Clearing..." : "Clear Flags"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
