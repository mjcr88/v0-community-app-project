import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Ban } from "lucide-react"
import { cancelEvent } from "@/app/actions/events"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"

interface UncancelEventButtonProps {
  eventId: string
  tenantSlug: string
}

export function UncancelEventButton({ eventId, tenantSlug }: UncancelEventButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUncancel = async () => {
    setIsLoading(true)
    try {
      const result = await cancelEvent(eventId, tenantSlug, "", true)
      if (result.success) {
        toast.success(result.message || "Event has been uncancelled")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to uncancel event")
      }
    } catch (error) {
      toast.error("An error occurred while uncancelling the event")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="default" size="sm" className="gap-2" onClick={handleUncancel} disabled={isLoading}>
      <Ban className="h-4 w-4" />
      {isLoading ? "Uncancelling..." : "Uncancel Event"}
    </Button>
  )
}
