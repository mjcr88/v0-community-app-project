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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface CancelTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (cancelReason?: string) => Promise<void>
  itemName: string
}

export function CancelTransactionDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
}: CancelTransactionDialogProps) {
  const [cancelReason, setCancelReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    await onConfirm(cancelReason || undefined)
    setIsSubmitting(false)
    onOpenChange(false)
    setCancelReason("")
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Transaction</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this request for "{itemName}"? The
            other party will be notified of the cancellation.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="cancelReason" className="text-sm text-muted-foreground">
            Reason (optional)
          </Label>
          <Textarea
            id="cancelReason"
            placeholder="Let the other party know why you're cancelling..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Go Back</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting ? "Cancelling..." : "Cancel Request"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
