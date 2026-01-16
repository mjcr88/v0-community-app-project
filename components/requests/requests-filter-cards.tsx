"use client"

import { cn } from "@/lib/utils"
import { Filter, AlertTriangle, Shield } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DashboardAnalytics } from "@/lib/analytics"

export type RequestFilterSectionType = "types" | "status" | "priority" | null

interface RequestsFilterCardsProps {
    activeFilter: RequestFilterSectionType
    onFilterChange: (filter: RequestFilterSectionType) => void
    disabled?: boolean
}

export function RequestsFilterCards({
    activeFilter,
    onFilterChange,
    disabled = false
}: RequestsFilterCardsProps) {
    const filterSections: { id: RequestFilterSectionType; label: string; icon: LucideIcon }[] = [
        { id: "types", label: "Type", icon: Filter },
        { id: "status", label: "Status", icon: AlertTriangle },
        { id: "priority", label: "Priority", icon: Shield },
    ]

    return (
        <div className="grid grid-cols-3 gap-3">
            {filterSections.filter(s => s.id !== null).map((section) => (
                <button
                    key={section.id}
                    onClick={() => {
                        const isCurrentlyActive = activeFilter === section.id
                        DashboardAnalytics.filterCardClicked('requests', section.id || '', isCurrentlyActive)
                        onFilterChange(isCurrentlyActive ? null : section.id)
                    }}
                    disabled={disabled}
                    className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 h-20 w-full",
                        disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md cursor-pointer",
                        activeFilter === section.id
                            ? "bg-primary/10 border-primary text-primary ring-1 ring-primary shadow-sm"
                            : "bg-card border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                >
                    <section.icon className={cn("w-5 h-5 mb-1.5", activeFilter === section.id ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-xs font-medium text-center leading-tight">{section.label}</span>
                </button>
            ))}
        </div>
    )
}
