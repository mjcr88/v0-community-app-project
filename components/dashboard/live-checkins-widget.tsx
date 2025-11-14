"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from 'lucide-react'
import { CheckInCard } from "@/components/check-ins/check-in-card"
import { useState, useEffect } from "react"
import { CreateCheckInButton } from "@/components/check-ins/create-check-in-button"
import { CheckInDetailModal } from "@/components/check-ins/check-in-detail-modal"
import { createBrowserClient } from "@/lib/supabase/client"

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
  const [checkIns, setCheckIns] = useState<CheckIn[]>(initialCheckIns)
  const [selectedCheckInId, setSelectedCheckInId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    const loadCheckIns = async () => {
      const supabase = createBrowserClient()
      
      // Calculate time 8 hours ago (max check-in duration)
      const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from("check_ins")
        .select(`
          *,
          creator:users!created_by(id, first_name, last_name, profile_picture_url),
          location:locations!location_id(id, name)
        `)
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .gte("start_time", eightHoursAgo)
        .order("start_time", { ascending: false })

      if (error) {
        console.error("[v0] Error loading check-ins:", error)
        return
      }

      if (!data) {
        setCheckIns([])
        return
      }

      // Filter expired check-ins client-side
      const now = new Date()
      const activeCheckIns = data.filter((checkIn) => {
        const expiresAt = new Date(checkIn.start_time)
        expiresAt.setMinutes(expiresAt.getMinutes() + checkIn.duration_minutes)
        return expiresAt > now
      })

      setCheckIns(activeCheckIns as CheckIn[])
    }

    // Refresh every 30 seconds - don't call immediately on mount
    const interval = setInterval(loadCheckIns, 30000)

    return () => clearInterval(interval)
  }, [tenantId])

  function handleCheckInClick(checkInId: string) {
    setSelectedCheckInId(checkInId)
    setIsDetailOpen(true)
  }

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
    <>
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
                onClick={() => handleCheckInClick(checkIn.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

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
