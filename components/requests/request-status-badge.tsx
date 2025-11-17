import { Badge } from "@/components/ui/badge"
import { Clock, Play, CheckCircle, XCircle } from 'lucide-react'
import type { RequestStatus } from "@/types/requests"

interface RequestStatusBadgeProps {
  status: RequestStatus
  compact?: boolean
}

export function RequestStatusBadge({ status, compact = false }: RequestStatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: "Pending",
      variant: "outline" as const,
      icon: <Clock className="h-3 w-3" />,
    },
    in_progress: {
      label: "In Progress",
      variant: "default" as const,
      icon: <Play className="h-3 w-3" />,
    },
    resolved: {
      label: "Resolved",
      variant: "secondary" as const,
      icon: <CheckCircle className="h-3 w-3" />,
    },
    rejected: {
      label: "Rejected",
      variant: "destructive" as const,
      icon: <XCircle className="h-3 w-3" />,
    },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={compact ? "text-xs gap-1" : "gap-1"}>
      {config.icon}
      {config.label}
    </Badge>
  )
}
