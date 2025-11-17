"use client"

import { AlertTriangle, Flag, Calendar, X, Ban, ShieldOff } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useTransition } from "react"
import { dismissListingFlag, adminUnflagListing, adminArchiveListings } from "@/app/actions/exchange-listings"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'

interface FlagDetail {
  id: string
  reason: string
  created_at: string
  flagged_by: string
  user: {
    id: string
    first_name: string | null
    last_name: string | null
    profile_picture_url: string | null
  } | null
}

interface ListingFlagDetailsProps {
  flags: FlagDetail[]
  listingId: string
  listingTitle: string
  tenantId: string
  tenantSlug: string
  onActionComplete?: () => void
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0) || ""
  const last = lastName?.charAt(0) || ""
  return (first + last).toUpperCase() || "U"
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function ListingFlagDetails({
  flags,
  listingId,
  listingTitle,
  tenantId,
  tenantSlug,
  onActionComplete,
}: ListingFlagDetailsProps) {
  const router = useRouter()
  const [dismissingFlags, setDismissingFlags] = useState<Set<string>>(new Set())
  const [localFlags, setLocalFlags] = useState(flags)
  
  const [unflagOpen, setUnflagOpen] = useState(false)
  const [unflagReason, setUnflagReason] = useState("")
  const [isUnflagging, startUnflagTransition] = useTransition()
  
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiveReason, setArchiveReason] = useState("")
  const [isArchiving, startArchiveTransition] = useTransition()

  const handleDismiss = async (flagId: string) => {
    setDismissingFlags((prev) => new Set(prev).add(flagId))
    setLocalFlags((prev) => prev.filter((f) => f.id !== flagId))

    const result = await dismissListingFlag(flagId, tenantSlug)

    if (result.success) {
      toast.success("Flag dismissed successfully")
      router.refresh()
    } else {
      setLocalFlags(flags)
      toast.error(result.error || "Failed to dismiss flag")
    }

    setDismissingFlags((prev) => {
      const next = new Set(prev)
      next.delete(flagId)
      return next
    })
  }

  const handleUnflag = async (e: React.FormEvent) => {
    e.preventDefault()

    if (unflagReason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters")
      return
    }

    if (unflagReason.trim().length > 500) {
      toast.error("Reason must be less than 500 characters")
      return
    }

    startUnflagTransition(async () => {
      const result = await adminUnflagListing(listingId, tenantId, tenantSlug, unflagReason)

      if (result.success) {
        toast.success("Listing unflagged successfully", {
          duration: 5000,
        })
        setUnflagOpen(false)
        setUnflagReason("")
        
        if (onActionComplete) {
          onActionComplete()
        }
        
        setTimeout(() => {
          router.refresh()
        }, 500)
      } else {
        toast.error(result.error || "Failed to unflag listing. Please try again.", {
          duration: 5000,
        })
      }
    })
  }

  const handleArchive = async (e: React.FormEvent) => {
    e.preventDefault()

    if (archiveReason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters")
      return
    }

    if (archiveReason.trim().length > 500) {
      toast.error("Reason must be less than 500 characters")
      return
    }

    startArchiveTransition(async () => {
      const result = await adminArchiveListings([listingId], tenantId, tenantSlug, archiveReason)

      if (result.success) {
        toast.success("Listing archived successfully", {
          duration: 5000,
        })
        setArchiveOpen(false)
        setArchiveReason("")
        
        if (onActionComplete) {
          onActionComplete()
        }
        
        setTimeout(() => {
          router.refresh()
        }, 500)
      } else {
        toast.error(result.error || "Failed to archive listing. Please try again.", {
          duration: 5000,
        })
      }
    })
  }

  const unflagCharacterCount = unflagReason.trim().length
  const unflagIsValid = unflagCharacterCount >= 10 && unflagCharacterCount <= 500
  
  const archiveCharacterCount = archiveReason.trim().length
  const archiveIsValid = archiveCharacterCount >= 10 && archiveCharacterCount <= 500

  if (localFlags.length === 0) {
    return null
  }

  return (
    <Card className="p-6 border-destructive/50 bg-destructive/5">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-destructive">Listing Flagged by Residents</h3>
            <p className="text-sm text-muted-foreground">
              This listing has been flagged {localFlags.length} {localFlags.length === 1 ? "time" : "times"} for admin
              review
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          {localFlags.map((flag) => (
            <div key={flag.id} className="space-y-3 p-4 rounded-lg bg-background border relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDismiss(flag.id)}
                disabled={dismissingFlags.has(flag.id)}
                title="Dismiss this flag"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex items-start justify-between gap-4 pr-10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage
                      src={flag.user?.profile_picture_url || undefined}
                      alt={`${flag.user?.first_name || "User"}'s avatar`}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(flag.user?.first_name, flag.user?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    {flag.user ? (
                      <Link
                        href={`/t/${tenantSlug}/dashboard/neighbours/${flag.user.id}`}
                        className="font-medium text-sm hover:underline text-primary truncate block"
                      >
                        {flag.user.first_name} {flag.user.last_name}
                      </Link>
                    ) : (
                      <span className="font-medium text-sm text-muted-foreground">Unknown User</span>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(flag.created_at)}
                    </div>
                  </div>
                </div>
                <Badge variant="destructive" className="gap-1 flex-shrink-0">
                  <Flag className="h-3 w-3" />
                  Flagged
                </Badge>
              </div>
              <div className="pl-11">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{flag.reason}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex gap-2">
          <Dialog open={unflagOpen} onOpenChange={setUnflagOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ShieldOff className="h-4 w-4" />
                Clear Flags
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleUnflag}>
                <DialogHeader>
                  <DialogTitle>Clear All Flags</DialogTitle>
                  <DialogDescription>
                    This will remove all flags from "{listingTitle}" and notify the creator that the listing has been
                    reviewed.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="unflag-reason">Admin Note (Optional)</Label>
                    <Textarea
                      id="unflag-reason"
                      placeholder="e.g., Listing reviewed, no violations found..."
                      value={unflagReason}
                      onChange={(e) => setUnflagReason(e.target.value)}
                      disabled={isUnflagging}
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {unflagCharacterCount} / 500 characters
                      {!unflagIsValid && unflagCharacterCount > 0 && " (minimum 10 characters)"}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setUnflagOpen(false)} disabled={isUnflagging}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!unflagIsValid || isUnflagging}>
                    {isUnflagging ? "Clearing..." : "Clear Flags"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Ban className="h-4 w-4" />
                Archive Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleArchive}>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <DialogTitle>Archive Listing</DialogTitle>
                  </div>
                  <DialogDescription>
                    This will archive "{listingTitle}", making it invisible to residents and cancelling all pending
                    requests. The creator and users with pending requests will be notified.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="archive-reason">Archive Reason *</Label>
                    <Textarea
                      id="archive-reason"
                      placeholder="e.g., Violates community guidelines, Inappropriate content..."
                      value={archiveReason}
                      onChange={(e) => setArchiveReason(e.target.value)}
                      disabled={isArchiving}
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {archiveCharacterCount} / 500 characters
                      {!archiveIsValid && archiveCharacterCount > 0 && " (minimum 10 characters)"}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setArchiveOpen(false)} disabled={isArchiving}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" disabled={!archiveIsValid || isArchiving}>
                    {isArchiving ? "Archiving..." : "Archive Listing"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  )
}
