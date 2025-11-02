"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Copy } from "lucide-react"

interface InviteLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inviteUrl: string
  title?: string
  description?: string
}

export function InviteLinkDialog({
  open,
  onOpenChange,
  inviteUrl,
  title = "Invitation Link Generated",
  description = "Share this link with the user to complete their registration.",
}: InviteLinkDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-link">Invite Link</Label>
            <div className="flex gap-2">
              <Input
                id="invite-link"
                value={inviteUrl}
                readOnly
                className="font-mono text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button type="button" size="icon" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Click the link to select it, or use the copy button to copy it to your clipboard.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
