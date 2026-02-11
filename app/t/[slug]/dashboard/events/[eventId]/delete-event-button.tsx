"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

import { deleteEvent } from "@/app/actions/events"
import { RioConfirmationModal } from "@/components/feedback/rio-confirmation-modal"
import { useRioFeedback } from "@/components/feedback/rio-feedback-provider"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Calendar, CalendarDays } from "lucide-react"

import React from "react"

interface DeleteEventButtonProps {
  eventId: string
  tenantId: string
  tenantSlug: string
  eventTitle: string
  customTrigger?: React.ReactNode
  isSeries?: boolean
}

export function DeleteEventButton({
  eventId,
  tenantId,
  tenantSlug,
  eventTitle,
  customTrigger,
  isSeries = false
}: DeleteEventButtonProps) {
  const router = useRouter()
  const { showFeedback } = useRioFeedback()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showScopeDialog, setShowScopeDialog] = useState(false)
  const [deleteScope, setDeleteScope] = useState<"this" | "series">("this")

  const handleDelete = async (scope: "this" | "series" = "this") => {
    setIsDeleting(true)

    const result = await deleteEvent(eventId, tenantSlug, tenantId, scope)

    if (result.success) {
      setIsOpen(false)
      router.replace(`/t/${tenantSlug}/dashboard/events`)
    } else {
      showFeedback({
        title: "Couldn't delete event",
        description: result.error || "Failed to delete event. Please try again.",
        variant: "error",
        image: "/rio/rio_no_results_confused.png"
      })
      setIsDeleting(false)
      setIsOpen(false)
    }
  }

  const selectScope = async (scope: "this" | "series") => {
    setShowScopeDialog(false)
    setDeleteScope(scope)
    setIsOpen(true)
  }

  const onButtonClick = () => {
    if (isSeries) {
      setShowScopeDialog(true)
    } else {
      setIsOpen(true)
    }
  }

  return (
    <>
      {customTrigger ? (
        <button type="button" onClick={onButtonClick} className="cursor-pointer bg-transparent border-0 p-0 text-left">
          {customTrigger}
        </button>
      ) : (
        <Button variant="destructive" size="sm" onClick={onButtonClick} disabled={isDeleting} className="gap-2">
          <Trash2 className="h-4 w-4" />
          Delete Event
        </Button>
      )}

      <RioConfirmationModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Delete Event"
        description={
          deleteScope === "series"
            ? "Are you sure you want to delete this event series? All future occurrences will be removed. This action cannot be undone."
            : "Are you sure you want to delete this event? This action cannot be undone."
        }
        confirmText="Delete"
        onConfirm={() => handleDelete(deleteScope)}
        isDestructive={true}
        image="/rio/rio_delete_warning.png"
        isLoading={isDeleting}
      />

      <ResponsiveDialog
        isOpen={showScopeDialog}
        setIsOpen={setShowScopeDialog}
        title="Delete Recurring Event"
        description="This event is part of a series. How would you like to apply this deletion?"
        className="px-0 sm:px-6"
      >
        <div className="flex flex-col gap-3 py-4 px-4">
          <div className="flex justify-center mb-4">
            <img
              src="/rio/rio_delete_warning.png"
              alt="Rio warning"
              className="h-32 w-auto"
            />
          </div>
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3"
            onClick={() => selectScope("this")}
          >
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">Only this event</span>
              <span className="text-xs text-muted-foreground">Delete only this specific occurrence</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3"
            onClick={() => selectScope("series")}
          >
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">This and future events</span>
              <span className="text-xs text-muted-foreground">Delete this and all following occurrences</span>
            </div>
          </Button>
        </div>
        <div className="hidden sm:flex sm:justify-end sm:gap-2 mb-4 px-4">
          <Button type="button" variant="secondary" onClick={() => setShowScopeDialog(false)}>
            Cancel
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  )
}
