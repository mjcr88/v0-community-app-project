import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AnnouncementPriority } from "@/types/announcements"

interface AnnouncementPriorityBadgeProps {
  priority: AnnouncementPriority
  className?: string
}

export function AnnouncementPriorityBadge({ priority, className }: AnnouncementPriorityBadgeProps) {
  switch (priority) {
    case "urgent":
      return (
        <Badge variant="destructive" className={cn("bg-red-100 text-red-800 hover:bg-red-100", className)}>
          Urgent
        </Badge>
      )
    case "important":
      return (
        <Badge variant="secondary" className={cn("bg-yellow-100 text-yellow-800 hover:bg-yellow-100", className)}>
          Important
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className={cn("text-gray-600", className)}>
          Normal
        </Badge>
      )
  }
}
