"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { CheckInCard } from "@/components/check-ins/check-in-card"
import { filterActiveCheckIns } from "@/lib/utils/filter-expired-checkins"
import { useEffect, useState } from "react"
import { CreateCheckInButton } from "@/components/check-ins/create-check-in-button"

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
  initialCheckIns: CheckIn[]
  tenantSlug: string
  tenantId: string
  userId: string
}

export function LiveCheckInsWidget({ initialCheckIns, tenantSlug, tenantId, userId }: LiveCheckInsWidgetProps) {
  const [checkIns, setCheckIns] = useState(initialCheckIns)

  // Filter out expired check-ins client-side
  useEffect(() => {
    // Filter on mount
    const active = filterActiveCheckIns(initialCheckIns)
    setCheckIns(active)

    // Re-filter every minute to auto-remove expired check-ins
    const interval = setInterval(() => {
      const stillActive = filterActiveCheckIns(checkIns)
      setCheckIns(stillActive)
    }, 60000) // 1 minute

    return () => clearInterval(interval)
  }, [initialCheckIns])

  if (checkIns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Check-ins</CardTitle>
          <CardDescription>See who's active in your community right now</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">No one is checked in right now. Be the first!</p>
            <CreateCheckInButton tenantSlug={tenantSlug} tenantId={tenantId} />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Live Check-ins</CardTitle>
          <CardDescription>
            {checkIns.length} {checkIns.length === 1 ? "resident" : "residents"} active now
          </CardDescription>
        </div>
        <CreateCheckInButton tenantSlug={tenantSlug} tenantId={tenantId} />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {checkIns.map((checkIn) => (
            <CheckInCard
              key={checkIn.id}
              checkIn={checkIn}
              tenantSlug={tenantSlug}
              userId={userId}
              tenantId={tenantId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
