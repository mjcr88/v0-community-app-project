import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { RequestStatus } from "@/types/requests"

interface RequestStatusBadgeProps {
  status: RequestStatus
  compact?: boolean
  className?: string
}

export function RequestStatusBadge({ status, compact, className }: RequestStatusBadgeProps) {
  const config = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-200" },
    resolved: { label: "Resolved", color: "bg-green-100 text-green-800 border-green-200" },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
  }

  const { label, color } = config[status]

  return (
    <Badge variant="outline" className={cn("font-normal", color, className)}>
      {label}
    </Badge>
  )
}
