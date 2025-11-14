"use client"

import { MapPin } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface CheckInLocationDisplayProps {
  locationType: "community_location" | "custom_temporary" | null
  locationId?: string | null
  locationName?: string | null
  customLocationName?: string | null
  slug?: string
  tenantSlug?: string
  compact?: boolean
  className?: string
}

export function CheckInLocationDisplay({
  locationType,
  locationId,
  locationName,
  customLocationName,
  slug,
  tenantSlug,
  compact = false,
  className,
}: CheckInLocationDisplayProps) {
  const routeSlug = tenantSlug || slug

  const displayName = locationType === "community_location" ? locationName : customLocationName

  if (!displayName) {
    return null
  }

  const content = (
    <div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
      <MapPin className="h-4 w-4 flex-shrink-0" />
      <span className={cn(compact && "truncate")}>{displayName}</span>
    </div>
  )

  // If it's a community location, make it a link to the map
  if (locationType === "community_location" && locationId && routeSlug) {
    return (
      <Link
        href={`/t/${routeSlug}/dashboard/map?locationId=${locationId}`}
        className="hover:text-foreground transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </Link>
    )
  }

  return content
}
