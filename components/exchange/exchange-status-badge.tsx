import { Badge } from "@/components/ui/badge"
import { Pause, AlertCircle, Wrench, CheckCircle } from 'lucide-react'

type ExchangeStatus = "draft" | "published" | "paused" | "cancelled" | "unavailable" | "maintenance"

interface ExchangeStatusBadgeProps {
  status: ExchangeStatus
  isAvailable?: boolean
  compact?: boolean
}

export function ExchangeStatusBadge({ status, isAvailable = true, compact = false }: ExchangeStatusBadgeProps) {
  let displayStatus = status
  if (status === 'published' && !isAvailable) {
    displayStatus = 'unavailable'
  } else if (status === 'published' && isAvailable) {
    displayStatus = 'published' // Will show as "Available"
  }
  
  const statusConfig = {
    draft: {
      label: "Draft",
      variant: "outline" as const,
      icon: null,
    },
    published: {
      label: "Available",
      variant: "default" as const,
      icon: <CheckCircle className="h-3 w-3" />,
    },
    paused: {
      label: "Paused",
      variant: "secondary" as const,
      icon: <Pause className="h-3 w-3" />,
    },
    unavailable: {
      label: "Unavailable",
      variant: "outline" as const,
      icon: <AlertCircle className="h-3 w-3" />,
    },
    cancelled: {
      label: "Cancelled",
      variant: "destructive" as const,
      icon: <AlertCircle className="h-3 w-3" />,
    },
    maintenance: {
      label: "Maintenance",
      variant: "destructive" as const,
      icon: <Wrench className="h-3 w-3" />,
    },
  }

  const config = statusConfig[displayStatus] || statusConfig.unavailable

  return (
    <Badge variant={config.variant} className={compact ? "text-xs gap-1" : "gap-1"}>
      {config.icon}
      {config.label}
    </Badge>
  )
}
