import { Wrench, HelpCircle, AlertTriangle, Shield, MoreHorizontal } from 'lucide-react'
import type { RequestType } from "@/types/requests"

interface RequestTypeIconProps {
  type: RequestType
  className?: string
}

export function RequestTypeIcon({ type, className = "h-5 w-5" }: RequestTypeIconProps) {
  const iconMap = {
    maintenance: <Wrench className={className} />,
    question: <HelpCircle className={className} />,
    complaint: <AlertTriangle className={className} />,
    safety: <Shield className={className} />,
    other: <MoreHorizontal className={className} />,
  }

  return iconMap[type] || iconMap.other
}
