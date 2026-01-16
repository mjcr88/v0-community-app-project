"use client"

import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

export interface FilterCardProps {
    /**
     * Unique identifier for the filter
     */
    id: string
    /**
     * Display label
     */
    label: string
    /**
     * Lucide icon component
     */
    icon: LucideIcon
    /**
     * Whether this filter is currently active
     */
    isActive?: boolean
    /**
     * Click handler
     */
    onClick?: () => void
    /**
     * Size variant - 'sm' for filter cards (h-20), 'lg' for explore/dashboard cards (h-28)
     * @default 'sm'
     */
    size?: 'sm' | 'lg'
    /**
     * Optional custom className
     */
    className?: string
}

/**
 * Reusable filter/explore card button component
 * Used across directory, events, exchange, notifications, requests, and dashboard pages
 */
export function FilterCard({
    id,
    label,
    icon: Icon,
    isActive = false,
    onClick,
    size = 'sm',
    className,
}: FilterCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center rounded-xl border transition-all duration-200 w-full hover:shadow-md",
                size === 'sm' ? "p-3 h-20" : "p-4 h-28",
                isActive
                    ? "bg-primary/10 border-primary text-primary ring-1 ring-primary shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                className
            )}
        >
            <Icon
                className={cn(
                    size === 'sm' ? "w-5 h-5 mb-1.5" : "w-8 h-8 mb-3",
                    isActive ? "text-primary" : "text-muted-foreground"
                )}
            />
            <span className="text-xs font-medium text-center leading-tight">{label}</span>
        </button>
    )
}
