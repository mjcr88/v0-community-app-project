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
      variant: "secondary" as const,
      className: "bg-honey/10 text-honey-dark hover:bg-honey/20 border-honey/20",
      icon: <Clock className="h-3 w-3" />,
    },
    in_progress: {
      label: "In Progress",
      variant: "secondary" as const,
      className: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
      icon: <Play className="h-3 w-3" />,
    },
    resolved: {
      label: "Resolved",
      variant: "default" as const,
      className: "bg-fresh-growth text-white hover:bg-fresh-growth/90 border-transparent",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    rejected: {
      label: "Rejected",
      variant: "destructive" as const,
      className: "bg-clay text-white hover:bg-clay/90 border-transparent",
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
