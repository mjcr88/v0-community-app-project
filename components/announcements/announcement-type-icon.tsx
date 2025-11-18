import { Megaphone, AlertTriangle, Wrench, Calendar, FileText, ShieldAlert } from 'lucide-react'
import { cn } from "@/lib/utils"
import type { AnnouncementType } from "@/types/announcements"

interface AnnouncementTypeIconProps {
  type: AnnouncementType
  className?: string
}

export function AnnouncementTypeIcon({ type, className }: AnnouncementTypeIconProps) {
  switch (type) {
    case "general":
      return <Megaphone className={cn("text-blue-500", className)} />
    case "emergency":
      return <AlertTriangle className={cn("text-red-500", className)} />
    case "maintenance":
      return <Wrench className={cn("text-orange-500", className)} />
    case "event":
      return <Calendar className={cn("text-purple-500", className)} />
    case "policy":
      return <FileText className={cn("text-gray-500", className)} />
    case "safety":
      return <ShieldAlert className={cn("text-yellow-500", className)} />
    default:
      return <Megaphone className={cn("text-gray-500", className)} />
  }
}
