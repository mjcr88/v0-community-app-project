import { Badge } from "@/components/ui/badge"
import { Pause, AlertCircle, Wrench, CheckCircle } from 'lucide-react'
import { cn } from "@/lib/utils"

type ExchangeStatus = "draft" | "published" | "paused" | "cancelled" | "unavailable" | "maintenance"

interface ExchangeStatusBadgeProps {
  status: ExchangeStatus
  isAvailable?: boolean
  compact?: boolean
  className?: string
}

export function ExchangeStatusBadge({ status, isAvailable = true, compact = false, className }: ExchangeStatusBadgeProps) {
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
      className: "border-muted-foreground/30 text-muted-foreground",
    },
    published: {
      label: "Available",
      variant: "default" as const,
      icon: <CheckCircle className="h-3 w-3" />,
      className: "bg-[hsl(var(--forest-growth))] hover:bg-[hsl(var(--forest-growth))]/90 border-[hsl(var(--forest-growth))] animate-pulse-slow",
    },
    paused: {
      label: "Paused",
      variant: "secondary" as const,
      icon: <Pause className="h-3 w-3" />,
      className: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20",
    },
    unavailable: {
      label: "Unavailable",
      variant: "outline" as const,
      icon: <AlertCircle className="h-3 w-3" />,
      className: "border-muted-foreground/30 text-muted-foreground",
    },
    cancelled: {
      label: "Cancelled",
      variant: "destructive" as const,
      icon: <AlertCircle className="h-3 w-3" />,
      className: "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))] border-[hsl(var(--error))]/20",
    },
    maintenance: {
      label: "Maintenance",
      variant: "destructive" as const,
      icon: <Wrench className="h-3 w-3" />,
      className: "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))] border-[hsl(var(--error))]/20",
    },
  }

  const config = statusConfig[displayStatus] || statusConfig.unavailable

  return (
    <Badge
      variant={config.variant}
      className={cn(
        compact ? "text-xs gap-1" : "gap-1",
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </Badge>
  )
}
