"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle } from 'lucide-react'

interface ConfirmBorrowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (message?: string) => Promise<void>
  borrowerName: string
  listingTitle: string
  isLoading?: boolean
}

export function ConfirmBorrowDialog({
  open,
  onOpenChange,
  onConfirm,
  borrowerName,
  listingTitle,
  isLoading,
}: ConfirmBorrowDialogProps) {
  const [message, setMessage] = useState("")

  const handleConfirm = async () => {
    await onConfirm(message || undefined)
    setMessage("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Confirm Borrow Request
          </DialogTitle>
          <DialogDescription>
            You are about to approve {borrowerName}&apos;s request to borrow <strong>{listingTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-message">
              Message to borrower <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="confirm-message"
              placeholder="Add any instructions, meeting location, or additional notes..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This message will be sent along with the confirmation notification.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Confirming..." : "Confirm Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
