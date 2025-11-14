import { Badge } from "@/components/ui/badge"
import { getActivityIcon, getActivityLabel } from "@/lib/check-in-activities"
import { cn } from "@/lib/utils"

interface CheckInActivityBadgeProps {
  activityType: string
  className?: string
}

export function CheckInActivityBadge({ activityType, className }: CheckInActivityBadgeProps) {
  const IconComponent = getActivityIcon(activityType)
  const label = getActivityLabel(activityType)

  return (
    <Badge variant="outline" className={cn("flex items-center gap-1.5 text-blue-600 border-blue-200", className)}>
      <IconComponent className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{label}</span>
    </Badge>
  )
}
