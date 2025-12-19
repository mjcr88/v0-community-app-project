"use client"

import { cn } from "@/lib/utils"
import { Search, Filter, X, ArrowUpDown, Tag, DollarSign, Sparkles, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DashboardAnalytics } from "@/lib/analytics"

export type FilterSectionType = "categories" | "price" | "condition" | "availability" | "sort" | null

interface ExchangeFilterCardsProps {
    activeFilter: FilterSectionType
    onFilterChange: (filter: FilterSectionType) => void
    disabled?: boolean
}

export function ExchangeFilterCards({
    activeFilter,
    onFilterChange,
    disabled = false
}: ExchangeFilterCardsProps) {
    const filterSections: { id: FilterSectionType; label: string; icon: LucideIcon }[] = [
        { id: "categories", label: "Categories", icon: Tag },
        { id: "price", label: "Price", icon: DollarSign },
        { id: "condition", label: "Condition", icon: Sparkles },
        { id: "availability", label: "Availability", icon: CheckCircle2 },
        { id: "sort", label: "Sort", icon: ArrowUpDown },
    ]

    return (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {filterSections.filter(s => s.id !== null).map((section) => (
                <button
                    key={section.id}
                    onClick={() => {
                        const isCurrentlyActive = activeFilter === section.id
                        DashboardAnalytics.filterCardClicked('exchange', section.id || '', isCurrentlyActive)
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
