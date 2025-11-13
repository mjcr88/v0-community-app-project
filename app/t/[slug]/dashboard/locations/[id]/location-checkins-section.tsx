"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, MapPin } from 'lucide-react'
import { CheckInCard } from "@/components/check-ins/check-in-card"
import { CreateCheckInButton } from "@/components/check-ins/create-check-in-button"
import { CheckInDetailModal } from "@/components/check-ins/check-in-detail-modal"

interface CheckIn {
  id: string
  title: string
  activity_type: string
  description?: string | null
  start_time: string
  duration_minutes: number
  location_type: "community_location" | "custom_temporary" | null
  location_id?: string | null
  location?: {
    id: string
    name: string
  } | null
  custom_location_name?: string | null
  created_by?: string
  creator?: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url?: string | null
  } | null
  attending_count?: number
  user_rsvp_status?: string | null
}

export function LocationCheckinsSection({
  checkIns,
  slug,
  locationId,
  locationName,
  tenantId,
  canCreateCheckIns,
}: {
  checkIns: CheckIn[]
  slug: string
  locationId: string
  locationName: string
  tenantId: string
  canCreateCheckIns: boolean
}) {
  const [selectedCheckInId, setSelectedCheckInId] = useState<string | null>(null)

  if (checkIns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Check-ins</CardTitle>
          <CardDescription>Who's here at {locationName} right now</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-4">
              <MapPin className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">No one is checked in here right now</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Be the first to check in and let others know you're here!
          </p>
          {canCreateCheckIns && (
            <CreateCheckInButton
              tenantSlug={slug}
              tenantId={tenantId}
              initialLocation={{
                type: "community_location",
                id: locationId,
                name: locationName,
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Be the First to Check In!
            </CreateCheckInButton>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Check-ins ({checkIns.length})</CardTitle>
              <CardDescription>Who's at {locationName} right now</CardDescription>
            </div>
            {canCreateCheckIns && (
              <CreateCheckInButton
                tenantSlug={slug}
                tenantId={tenantId}
                initialLocation={{
                  type: "community_location",
                  id: locationId,
                  name: locationName,
                }}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Check in Here
              </CreateCheckInButton>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {checkIns.map((checkIn) => (
              <CheckInCard
                key={checkIn.id}
                checkIn={checkIn}
                tenantSlug={slug}
                tenantId={tenantId}
                userId={checkIn.created_by || null}
                onClick={() => setSelectedCheckInId(checkIn.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCheckInId && (
        <CheckInDetailModal
          checkInId={selectedCheckInId}
          tenantSlug={slug}
          tenantId={tenantId}
          open={!!selectedCheckInId}
          onOpenChange={(open) => !open && setSelectedCheckInId(null)}
        />
      )}
    </>
  )
}
