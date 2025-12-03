"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { CheckInActivityBadge } from "./check-in-activity-badge"
import { CheckInTimeBadge } from "./check-in-time-badge"
import { CheckInLocationDisplay } from "./check-in-location-display"
import { cn } from "@/lib/utils"
import { CheckInRsvpQuickAction } from "./check-in-rsvp-quick-action"

interface CheckInCardProps {
  checkIn: {
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
      avatar_url?: string | null
      profile_picture_url?: string | null
    } | null
    attending_count?: number
    user_rsvp_status?: string | null
  }
  tenantSlug: string
  tenantId: string
  userId: string | null
  onClick?: () => void
  className?: string
}

export function CheckInCard({ checkIn, tenantSlug, tenantId, userId, onClick, className }: CheckInCardProps) {
  const creatorName = checkIn.creator ? `${checkIn.creator.first_name} ${checkIn.creator.last_name}` : "Unknown"
  const creatorInitials = checkIn.creator ? `${checkIn.creator.first_name[0]}${checkIn.creator.last_name[0]}` : "?"

  const attendingCount = checkIn.attending_count || 0
  const avatarUrl = checkIn.creator?.avatar_url || checkIn.creator?.profile_picture_url

  return (
    <Card className={cn("p-4 hover:bg-accent transition-colors cursor-pointer", className)} onClick={onClick}>
      <div className="space-y-3">
        {/* Header: Creator info and time badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>{creatorInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{creatorName}</p>
              <p className="text-xs text-muted-foreground">checked in</p>
            </div>
          </div>
          <CheckInTimeBadge
            startTime={checkIn.start_time}
            durationMinutes={checkIn.duration_minutes}
            className="flex-shrink-0"
          />
        </div>

        {/* Title and activity */}
        <div className="space-y-2">
          <h3 className="font-semibold text-base leading-tight">{checkIn.title}</h3>
          <CheckInActivityBadge activityType={checkIn.activity_type} />
        </div>

        {/* Description if present */}
        {checkIn.description && <p className="text-sm text-muted-foreground line-clamp-2">{checkIn.description}</p>}

        {/* Footer: Location and RSVP count */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <CheckInLocationDisplay
            locationType={checkIn.location_type}
            locationId={checkIn.location_id || checkIn.location?.id}
            locationName={checkIn.location?.name}
            customLocationName={checkIn.custom_location_name}
            tenantSlug={tenantSlug}
            compact
          />

          <div className="flex items-center gap-2">
            {userId && (
              <CheckInRsvpQuickAction
                checkInId={checkIn.id}
                tenantId={tenantId}
                tenantSlug={tenantSlug}
                userId={userId}
                currentRsvpStatus={checkIn.user_rsvp_status as "yes" | "maybe" | "no" | null}
              />
            )}
            {attendingCount > 0 && (
              <Badge variant="secondary" className="gap-1 flex-shrink-0">
                <Users className="h-3 w-3" />
                {attendingCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
