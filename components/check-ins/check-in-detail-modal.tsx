"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil, Trash2, Clock, X } from "lucide-react"
import { CheckInTimeBadge } from "./check-in-time-badge"
import { CheckInActivityBadge } from "./check-in-activity-badge"
import { CheckInLocationDisplay } from "./check-in-location-display"
import { CheckInRsvpSection } from "./check-in-rsvp-section"
import { CheckInAttendeesSection } from "./check-in-attendees-section"
import { EditCheckInModal } from "./edit-check-in-modal"
import { getCheckInById, deleteCheckIn, extendCheckIn, endCheckInEarly } from "@/app/actions/check-ins"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CheckInDetailModalProps {
  checkInId: string
  tenantId: string
  tenantSlug: string
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.charAt(0) || ""
  const last = lastName?.charAt(0) || ""
  return (first + last).toUpperCase() || "U"
}

export function CheckInDetailModal({
  checkInId,
  tenantId,
  tenantSlug,
  userId,
  open,
  onOpenChange,
}: CheckInDetailModalProps) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEndOpen, setIsEndOpen] = useState(false)
  const [isExtending, setIsExtending] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open && checkInId) {
      loadCheckIn()
    }
  }, [open, checkInId])

  async function loadCheckIn() {
    setIsLoading(true)
    const result = await getCheckInById(checkInId, tenantId)

    if (result.success && result.data) {
      setCheckIn(result.data)
    } else {
      toast.error("Failed to load check-in")
      onOpenChange(false)
    }

    setIsLoading(false)
  }

  async function handleExtend(additionalMinutes: number) {
    setIsExtending(true)
    const result = await extendCheckIn(checkInId, tenantId, tenantSlug, additionalMinutes)

    if (result.success) {
      toast.success(`Extended by ${additionalMinutes} minutes`)
      await loadCheckIn()
      router.refresh()
    } else {
      toast.error(result.error || "Failed to extend check-in")
    }

    setIsExtending(false)
  }

  async function handleEndEarly() {
    setIsEnding(true)
    const result = await endCheckInEarly(checkInId, tenantId, tenantSlug)

    if (result.success) {
      toast.success("Check-in ended")
      onOpenChange(false)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to end check-in")
    }

    setIsEnding(false)
    setIsEndOpen(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteCheckIn(checkInId, tenantId, tenantSlug)

    if (result.success) {
      toast.success("Check-in deleted")
      onOpenChange(false)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to delete check-in")
    }

    setIsDeleting(false)
    setIsDeleteOpen(false)
  }

  if (isLoading || !checkIn) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Loading Check-in</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const isCreator = userId === checkIn.created_by
  const creatorName =
    `${checkIn.creator?.first_name || ""} ${checkIn.creator?.last_name || ""}`.trim() || "Unknown User"

  return (
    <>
      <Dialog open={open && !isEditOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CheckInActivityBadge activityType={checkIn.activity_type} />
                  <CheckInTimeBadge startTime={checkIn.start_time} durationMinutes={checkIn.duration_minutes} />
                  {checkIn.visibility_scope !== "community" && (
                    <Badge variant="secondary" className="text-xs">
                      {checkIn.visibility_scope === "neighborhood" ? "Neighborhood" : "Private"}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-2xl">{checkIn.title}</DialogTitle>
              </div>

              {isCreator && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Clock className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExtend(30)} disabled={isExtending}>
                        Extend +30 min
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExtend(60)} disabled={isExtending}>
                        Extend +1 hour
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExtend(120)} disabled={isExtending}>
                        Extend +2 hours
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" onClick={() => setIsEndOpen(true)} className="gap-2">
                    <X className="h-4 w-4" />
                    End
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Creator Info */}
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
              <Avatar className="h-10 w-10">
                <AvatarImage src={checkIn.creator?.profile_picture_url || undefined} alt={`${creatorName}'s avatar`} />
                <AvatarFallback>{getInitials(checkIn.creator?.first_name, checkIn.creator?.last_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Checked in by</p>
                <p className="font-medium">{creatorName}</p>
              </div>
            </div>

            {/* Description */}
            {checkIn.description && (
              <div className="space-y-2">
                <h3 className="font-semibold">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{checkIn.description}</p>
              </div>
            )}

            {/* Location */}
            <div className="space-y-2">
              <h3 className="font-semibold">Location</h3>
              <CheckInLocationDisplay
                locationType={checkIn.location_type}
                locationName={checkIn.location?.name || checkIn.custom_location_name}
                locationId={checkIn.location_id}
                tenantSlug={tenantSlug}
              />
            </div>

            {/* Time Info */}
            <div className="space-y-2">
              <h3 className="font-semibold">Time Details</h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Started:</span>{" "}
                  {new Date(checkIn.start_time).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <p>
                  <span className="text-muted-foreground">Duration:</span>{" "}
                  {checkIn.duration_minutes >= 60
                    ? `${Math.floor(checkIn.duration_minutes / 60)}h ${checkIn.duration_minutes % 60 > 0 ? `${checkIn.duration_minutes % 60}m` : ""}`
                    : `${checkIn.duration_minutes}m`}
                </p>
              </div>
            </div>

            {/* RSVP Section */}
            <CheckInRsvpSection checkInId={checkInId} tenantId={tenantId} tenantSlug={tenantSlug} userId={userId} />

            {/* Attendees Section */}
            <CheckInAttendeesSection checkInId={checkInId} tenantId={tenantId} tenantSlug={tenantSlug} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <EditCheckInModal
        checkInId={checkInId}
        tenantId={tenantId}
        tenantSlug={tenantSlug}
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) {
            loadCheckIn()
          }
        }}
      />

      {/* End Early Confirmation */}
      <AlertDialog open={isEndOpen} onOpenChange={setIsEndOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End check-in early?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end your check-in before the scheduled time. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndEarly} disabled={isEnding}>
              {isEnding ? "Ending..." : "End Check-in"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete check-in?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{checkIn.title}" and all associated RSVPs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
