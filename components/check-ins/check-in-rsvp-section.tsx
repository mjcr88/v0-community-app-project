"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, HelpCircle, X, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { rsvpToCheckIn, getCheckInRsvpCounts } from "@/app/actions/check-ins"
import { toast } from "sonner"

interface CheckInRsvpSectionProps {
  checkInId: string
  tenantId: string
  tenantSlug: string
  userId: string | null
}

export function CheckInRsvpSection({ checkInId, tenantId, tenantSlug, userId }: CheckInRsvpSectionProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [counts, setCounts] = useState({ yes: 0, maybe: 0, no: 0 })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userId) return

    async function loadData() {
      // Load RSVP counts
      const countsResult = await getCheckInRsvpCounts(checkInId)
      if (countsResult.success && countsResult.data) {
        setCounts(countsResult.data)
      }
    }

    loadData()
  }, [checkInId, userId])

  async function handleRsvp(status: "yes" | "maybe" | "no") {
    if (!userId) {
      toast.error("Please sign in to RSVP")
      return
    }

    setIsLoading(true)
    const result = await rsvpToCheckIn(checkInId, tenantId, tenantSlug, status)

    if (result.success) {
      setCurrentStatus(status)
      const statusLabel = status === "yes" ? "Coming" : status === "maybe" ? "Maybe" : "Not Coming"
      toast.success(`RSVP updated: ${statusLabel}`)

      // Reload counts
      const countsResult = await getCheckInRsvpCounts(checkInId)
      if (countsResult.success && countsResult.data) {
        setCounts(countsResult.data)
      }

      router.refresh()
    } else {
      toast.error(result.error || "Failed to update RSVP")
    }

    setIsLoading(false)
  }

  return (
    <div className="p-6 border rounded-lg space-y-4 bg-card">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">RSVP</h3>
        </div>

        {/* Attendee Counts */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="secondary" className="gap-1">
            <Check className="h-3 w-3" />
            {counts.yes} Coming
          </Badge>
          <Badge variant="outline" className="gap-1">
            <HelpCircle className="h-3 w-3" />
            {counts.maybe} Maybe
          </Badge>
        </div>
      </div>

      {/* RSVP Buttons */}
      {userId ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={currentStatus === "yes" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRsvp("yes")}
            disabled={isLoading}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Coming
          </Button>
          <Button
            variant={currentStatus === "maybe" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRsvp("maybe")}
            disabled={isLoading}
            className="gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Maybe
          </Button>
          <Button
            variant={currentStatus === "no" ? "destructive" : "outline"}
            size="sm"
            onClick={() => handleRsvp("no")}
            disabled={isLoading}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Not Coming
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Please sign in to RSVP to this check-in</p>
      )}
    </div>
  )
}
