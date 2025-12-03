"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

import { deleteEvent } from "@/app/actions/events"
import { RioConfirmationModal } from "@/components/feedback/rio-confirmation-modal"
import { useRioFeedback } from "@/components/feedback/rio-feedback-provider"

interface DeleteEventButtonProps {
  eventId: string
  tenantId: string
  tenantSlug: string
  eventTitle: string
}

export function DeleteEventButton({ eventId, tenantId, tenantSlug, eventTitle }: DeleteEventButtonProps) {
  const router = useRouter()
  const { showFeedback } = useRioFeedback()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    const result = await deleteEvent(eventId, tenantId, tenantSlug)

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

  return (
    <>
      <Button variant="destructive" size="sm" className="gap-2" onClick={() => setIsOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Delete Event
      </Button>

      <RioConfirmationModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Delete event?"
        description={
          <span className="block space-y-2">
            <span>You are about to delete <strong className="text-foreground">{eventTitle}</strong>.</span>
            <span className="block">This action cannot be undone. The event will be permanently removed.</span>
          </span>
        }
        image="/rio/rio_delete_warning.png"
        confirmText="Delete Event"
        onConfirm={handleDelete}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  )
}
