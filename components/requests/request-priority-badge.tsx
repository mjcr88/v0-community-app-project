import { Badge } from "@/components/ui/badge"
import type { RequestPriority } from "@/types/requests"
import { cn } from "@/lib/utils"

interface RequestPriorityBadgeProps {
    priority: RequestPriority
    className?: string
}

export function RequestPriorityBadge({ priority, className }: RequestPriorityBadgeProps) {
    const config = {
        normal: { label: "Normal", icon: "🟢", color: "bg-slate-100 text-slate-800 border-slate-200" },
        urgent: { label: "Urgent", icon: "🟠", color: "bg-orange-100 text-orange-800 border-orange-200" },
        emergency: { label: "Emergency", icon: "🔴", color: "bg-red-100 text-red-800 border-red-200" },
    }

    const { label, icon, color } = config[priority]

    return (
        <Badge variant="outline" className={cn("gap-1.5 font-normal", color, className)}>
            <span className="text-[10px]">{icon}</span>
            {label}
        </Badge>
    )
}
