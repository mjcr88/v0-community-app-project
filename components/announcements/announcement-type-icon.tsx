import { Megaphone, AlertTriangle, Wrench, Calendar, FileText, ShieldAlert } from 'lucide-react'
import { cn } from "@/lib/utils"

type AnnouncementType = "general" | "emergency" | "maintenance" | "event" | "policy" | "safety"

export function AnnouncementTypeIcon({
  type,
  className,
}: {
  type: AnnouncementType
  className?: string
}) {
  const icons = {
    general: Megaphone,
    emergency: AlertTriangle,
    maintenance: Wrench,
    event: Calendar,
    policy: FileText,
    safety: ShieldAlert,
  }

  const Icon = icons[type] || Megaphone

  return <Icon className={cn("text-muted-foreground", className)} />
}
