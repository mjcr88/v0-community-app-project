"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { saveEvent, unsaveEvent, isEventSaved } from "@/app/actions/events"
import { toast } from "sonner"

interface SaveEventButtonProps {
  eventId: string
  userId: string | null
}

export function SaveEventButton({ eventId, userId }: SaveEventButtonProps) {
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userId) return

    async function loadSavedStatus() {
      const result = await isEventSaved(eventId)
      if (result.success) {
        setIsSaved(result.data)
      }
    }

    loadSavedStatus()
  }, [eventId, userId])

  async function handleSaveToggle() {
    if (!userId) {
      toast.error("Please sign in to save events")
      return
    }

    setIsLoading(true)

    if (isSaved) {
      const result = await unsaveEvent(eventId)
      if (result.success) {
        setIsSaved(false)
        toast.success("Event removed from saved")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to unsave event")
      }
    } else {
      const result = await saveEvent(eventId)
      if (result.success) {
        setIsSaved(true)
        toast.success("Event saved!")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to save event")
      }
    }

    setIsLoading(false)
  }

  if (!userId) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSaveToggle}
      disabled={isLoading}
      className="gap-2 bg-transparent"
    >
      <Heart className={`h-4 w-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
      {isSaved ? "Saved" : "Save"}
    </Button>
  )
}
