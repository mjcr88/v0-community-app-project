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
import { Trash2 } from 'lucide-react'
import { adminDeleteListings } from "@/app/actions/exchange-listings"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"

interface DeleteListingsDialogProps {
  listingIds: string[]
  listingTitle?: string
  tenantId: string
  tenantSlug: string
  triggerSize?: "sm" | "default" | "lg" | "icon"
}

export function DeleteListingsDialog({
  listingIds,
  listingTitle,
  tenantId,
  tenantSlug,
  triggerSize = "sm",
}: DeleteListingsDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = async () => {
    console.log("[v0] Delete started for:", listingIds)
    
    startTransition(async () => {
      try {
        const result = await adminDeleteListings(listingIds, tenantId, tenantSlug)
        console.log("[v0] Delete result:", result)

        if (result.success) {
          toast.success(`${listingIds.length} listing(s) deleted successfully`)
          console.log("[v0] Delete successful")
          
          setOpen(false)
          router.refresh()
        } else {
          console.error("[v0] Delete failed:", result.error)
          toast.error(result.error || "Failed to delete listings")
        }
      } catch (error) {
        console.error("[v0] Unexpected error deleting:", error)
        toast.error("An unexpected error occurred")
      }
    })
  }

  const title = listingIds.length === 1 && listingTitle 
    ? `Delete "${listingTitle}"?`
    : `Delete ${listingIds.length} listing(s)?`

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size={triggerSize}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the selected listing(s) and all associated data including photos, transactions, and flags.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
