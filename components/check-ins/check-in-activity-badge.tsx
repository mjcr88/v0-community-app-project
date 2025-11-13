import { Badge } from "@/components/ui/badge"
import { getActivityIcon } from "@/lib/check-in-activities"

interface CheckInActivityBadgeProps {
  activityType: string
  className?: string
}

export function CheckInActivityBadge({ activityType, className }: CheckInActivityBadgeProps) {
  const { icon: Icon, label } = getActivityIcon(activityType)

  return (
    <Badge variant="outline" className={`gap-1 text-xs bg-blue-50 text-blue-700 border-blue-200 ${className || ""}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}
