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
    console.log("[v0] Clear flags started for:", listingIds)
    
    startTransition(async () => {
      try {
        for (const listingId of listingIds) {
          console.log("[v0] Clearing flags for listing:", listingId)
          const result = await adminUnflagListing(listingId, tenantId, tenantSlug, reason || undefined)
          console.log("[v0] Unflag result:", result)

          if (!result.success) {
            console.error("[v0] Failed to clear flags:", result.error)
            toast.error(result.error || `Failed to clear flags for listing`)
            return
          }
        }

        console.log("[v0] All flags cleared successfully")
        toast.success(`Flags cleared for ${listingIds.length} listing${listingIds.length > 1 ? "s" : ""}`)
        
        setOpen(false)
        setReason("")
        
        // Delay refresh slightly to ensure revalidation completes
        setTimeout(() => {
          router.refresh()
        }, 150)
      } catch (error) {
        console.error("[v0] Unexpected error clearing flags:", error)
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
