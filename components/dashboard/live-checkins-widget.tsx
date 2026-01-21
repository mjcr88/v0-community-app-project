"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Loader2 } from 'lucide-react'
import { CheckInCard } from "@/components/check-ins/check-in-card"
import { useState, useEffect } from "react"
import { CreateCheckInButton } from "@/components/check-ins/create-check-in-button"
import { CheckInDetailModal } from "@/components/check-ins/check-in-detail-modal"
import useSWR from "swr"
import { useSearchParams } from "next/navigation"

interface CheckIn {
  id: string
  title: string
  activity_type: string
  description: string | null
  start_time: string
  duration_minutes: number
  location_type: "community_location" | "custom_temporary" | null
  location: {
    id: string
    name: string
  } | null
  custom_location_name: string | null
  creator: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  }
  user_rsvp_status: "yes" | "maybe" | "no" | null
  attending_count: number
}

interface LiveCheckInsWidgetProps {
  tenantSlug: string
  tenantId: string
  userId: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function LiveCheckInsWidget({ tenantSlug, tenantId, userId }: LiveCheckInsWidgetProps) {
  const searchParams = useSearchParams()
  const urlCheckInId = searchParams.get("checkInId")

  const { data: checkIns, error, isLoading } = useSWR<CheckIn[]>(
    `/api/check-ins/${tenantId}`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      errorRetryCount: 0,
      onError: (err) => {
        console.log("[v0] Check-ins widget fetch error (non-critical):", err.message)
      },
    }
  )

  const [selectedCheckInId, setSelectedCheckInId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    if (urlCheckInId) {
      setSelectedCheckInId(urlCheckInId)
      setIsDetailOpen(true)
    }
  }, [urlCheckInId])

  function handleCheckInClick(checkInId: string) {
    setSelectedCheckInId(checkInId)
    setIsDetailOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Failed to load check-ins. Please refresh the page.
      </div>
    )
  }

  if (!checkIns || checkIns.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="relative w-20 h-20 mx-auto mb-3">
          <img src="/rio/parrot.png" alt="Rio" className="object-contain w-full h-full" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">No one is checked in right now</p>
        <CreateCheckInButton tenantSlug={tenantSlug} tenantId={tenantId} />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Mobile: Stack title/badge and button | Desktop: Single row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Live Check-ins</h3>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
              {checkIns.length} Active
            </Badge>
          </div>
          <CreateCheckInButton tenantSlug={tenantSlug} tenantId={tenantId} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {checkIns.map((checkIn) => (
            <CheckInCard
              key={checkIn.id}
              checkIn={checkIn}
              tenantSlug={tenantSlug}
              userId={userId}
              tenantId={tenantId}
              onClick={() => handleCheckInClick(checkIn.id)}
            />
          ))}
        </div>
      </div>

      {selectedCheckInId && (
        <CheckInDetailModal
          checkInId={selectedCheckInId}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          userId={userId}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}
    </>
  )
}
