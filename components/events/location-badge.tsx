import { Badge } from "@/components/ui/badge"
import { MapPin, MapPinned } from "lucide-react"

interface LocationBadgeProps {
  locationType: "community_location" | "custom_temporary" | null
  locationName?: string | null
  customLocationName?: string | null
  compact?: boolean
}

export function LocationBadge({ locationType, locationName, customLocationName, compact = false }: LocationBadgeProps) {
  if (!locationType) {
    return null
  }

  if (locationType === "community_location" && locationName) {
    return (
      <Badge variant="outline" className="gap-1 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
        <MapPin className="h-3 w-3" />
        {compact ? locationName.substring(0, 15) + (locationName.length > 15 ? "..." : "") : locationName}
      </Badge>
    )
  }

  if (locationType === "custom_temporary" && customLocationName) {
    return (
      <Badge variant="outline" className="gap-1 text-xs bg-purple-50 text-purple-700 border-purple-200">
        <MapPinned className="h-3 w-3" />
        {compact
          ? customLocationName.substring(0, 15) + (customLocationName.length > 15 ? "..." : "")
          : customLocationName}
      </Badge>
    )
  }

  return null
}
