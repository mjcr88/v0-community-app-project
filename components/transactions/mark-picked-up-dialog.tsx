"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Package } from 'lucide-react'

interface MarkPickedUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  itemName: string
  categoryName?: string
  isLoading?: boolean
}

export function MarkPickedUpDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  categoryName = "",
  isLoading: externalIsLoading,
}: MarkPickedUpDialogProps) {
  const [internalIsLoading, setInternalIsLoading] = useState(false)
  const isLoading = externalIsLoading || internalIsLoading

  const handleConfirm = async () => {
    setInternalIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error confirming pickup:", error)
    } finally {
      setInternalIsLoading(false)
    }
  }

  // Determine if this is a service or item
  const isService = ["Services & Skills", "Food & Produce"].includes(categoryName)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isService ? "Confirm Completion" : "Confirm Pickup"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isService
              ? `Confirm that "${itemName}" has been completed. This will mark the transaction as finished.`
              : `Confirm that "${itemName}" has been picked up. This will start the borrowing period.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Confirming..." : isService ? "Confirm Completion" : "Confirm Pickup"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
