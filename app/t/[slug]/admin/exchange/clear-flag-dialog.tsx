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
  listingId: string
  listingTitle: string
  tenantId: string
  tenantSlug: string
  triggerSize?: "sm" | "default" | "lg" | "icon"
}

export function ClearFlagDialog({
  listingId,
  listingTitle,
  tenantId,
  tenantSlug,
  triggerSize = "sm",
}: ClearFlagDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleClearFlags = async () => {
    startTransition(async () => {
      try {
        const result = await adminUnflagListing(listingId, tenantId, tenantSlug, reason || undefined)

        if (result.success) {
          toast.success("Flags cleared successfully")
          setOpen(false)
          setReason("")
          router.refresh()
        } else {
          toast.error(result.error || "Failed to clear flags")
        }
      } catch (error) {
        toast.error("An unexpected error occurred")
      }
    })
  }

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
          <AlertDialogTitle>Clear all flags for "{listingTitle}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove all flags from this listing. You can optionally provide a note to the creator explaining why the flags were cleared.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="clear-reason">Note to creator (optional)</Label>
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
            The creator will be notified that flags have been cleared.
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
