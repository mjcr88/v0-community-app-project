"use client"

import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, ChevronDown } from 'lucide-react'
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
  const [isOpen, setIsOpen] = useState(checkIns.length > 0)

  if (checkIns.length === 0) {
    return null
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <MapPin className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">
                      Active Check-ins ({checkIns.length})
                    </CardTitle>
                    <CardDescription className="mt-1">Who's at {locationName} right now</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
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
                      onClick={(e) => e?.stopPropagation?.()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Check in Here
                    </CreateCheckInButton>
                  )}
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
