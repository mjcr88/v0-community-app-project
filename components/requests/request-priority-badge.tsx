import { Badge } from "@/components/ui/badge"
import { AlertCircle, AlertTriangle } from 'lucide-react'
import type { RequestPriority } from "@/types/requests"

interface RequestPriorityBadgeProps {
  priority: RequestPriority
}

const priorityConfig = {
  normal: {
    label: "Normal",
    variant: "outline",
    className: "text-muted-foreground border-border",
    icon: null, // No icon for normal priority
  },
  urgent: {
    label: "Urgent",
    variant: "secondary",
    className: "bg-clay/10 text-clay border-clay/20",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  emergency: {
    label: "Emergency",
    variant: "destructive",
    className: "bg-sunrise text-white hover:bg-sunrise/90 border-transparent shadow-sm",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
}

export function RequestPriorityBadge({ priority }: RequestPriorityBadgeProps) {
  const config = priorityConfig[priority]

  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  )
}
