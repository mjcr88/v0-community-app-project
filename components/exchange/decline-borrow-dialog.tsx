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
import { XCircle } from 'lucide-react'

interface DeclineBorrowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDecline: (message?: string) => Promise<void>
  borrowerName: string
  listingTitle: string
  isLoading?: boolean
}

export function DeclineBorrowDialog({
  open,
  onOpenChange,
  onDecline,
  borrowerName,
  listingTitle,
  isLoading,
}: DeclineBorrowDialogProps) {
  const [message, setMessage] = useState("")

  const handleDecline = async () => {
    await onDecline(message || undefined)
    setMessage("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            Decline Borrow Request
          </DialogTitle>
          <DialogDescription>
            You are declining {borrowerName}&apos;s request to borrow <strong>{listingTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="decline-message">
              Message to borrower <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="decline-message"
              placeholder="You can optionally explain why you're declining this request..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This message will be sent along with the decline notification.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDecline} 
            disabled={isLoading}
          >
            {isLoading ? "Declining..." : "Decline Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
