import { Badge } from "@/components/ui/badge"
import { Pause, AlertCircle, Wrench } from 'lucide-react'

type ExchangeStatus = "available" | "paused" | "unavailable" | "maintenance"

interface ExchangeStatusBadgeProps {
  status: ExchangeStatus
  compact?: boolean
}

export function ExchangeStatusBadge({ status, compact = false }: ExchangeStatusBadgeProps) {
  const statusConfig = {
    available: {
      label: "Available",
      variant: "default" as const,
      icon: null,
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
    maintenance: {
      label: "Maintenance",
      variant: "destructive" as const,
      icon: <Wrench className="h-3 w-3" />,
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
