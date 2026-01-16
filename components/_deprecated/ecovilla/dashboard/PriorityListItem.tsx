"use client"

import React from "react"
import { Calendar, Megaphone, MapPin, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { PriorityItem } from "./PriorityHeroCard"

interface PriorityListItemProps {
    item: PriorityItem
    onClick?: () => void
    className?: string
}

const typeIcons = {
    announcement: Megaphone,
    event: Calendar,
    "check-in": MapPin,
    poll: Megaphone,
}

const typeColors = {
    announcement: "text-orange-600 bg-orange-50",
    event: "text-blue-600 bg-blue-50",
    "check-in": "text-green-600 bg-green-50",
    poll: "text-purple-600 bg-purple-50",
}

export function PriorityListItem({ item, onClick, className }: PriorityListItemProps) {
    const Icon = typeIcons[item.type] || Megaphone

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-4 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group border border-transparent hover:border-border",
                className
            )}
        >
            <div className={cn("p-2 rounded-full shrink-0", typeColors[item.type])}>
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-semibold text-sm truncate text-foreground">
                        {item.title}
                    </h4>
                    {item.isUrgent && (
                        <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                    )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                    {item.description}
                </p>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
        </button>
    )
}
