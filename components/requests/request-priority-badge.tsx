import { Badge } from "@/components/ui/badge"
import { AlertCircle, AlertTriangle } from 'lucide-react'
import type { RequestPriority } from "@/types/requests"

interface RequestPriorityBadgeProps {
  priority: RequestPriority
}

export function RequestPriorityBadge({ priority }: RequestPriorityBadgeProps) {
  if (priority === 'normal') {
    return null // Don't show badge for normal priority
  }

  const priorityConfig = {
    urgent: {
      label: "Urgent",
      className: "bg-orange-100 text-orange-700 border-orange-300",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    emergency: {
      label: "Emergency",
      className: "bg-red-100 text-red-700 border-red-300",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  }

  const config = priorityConfig[priority]

  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  )
}
