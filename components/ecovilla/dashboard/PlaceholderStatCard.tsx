"use client"

import { Card, CardContent } from "@/components/library/card"
import { Badge } from "@/components/library/badge"
import { cn } from "@/lib/utils"
import { NumberTicker } from "@/components/library/number-ticker"

interface PlaceholderStatCardProps {
    value: number
    label: string
    scope?: "Personal" | "Neighborhood" | "Community"
    icon?: string
    trend?: {
        value: number
        label: string
        positive: boolean
    }
    className?: string
}

export function PlaceholderStatCard({
    value,
    label,
    scope = "Personal",
    icon = "📊",
    trend,
    className
}: PlaceholderStatCardProps) {
    return (
        <Card className={cn("relative hover:shadow-md transition-all h-full", className)}>
            <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                    {/* Header: Icon & Value */}
                    <div className="flex items-start justify-between">
                        <span className="text-3xl">{icon}</span>
                        <NumberTicker value={value} className="text-4xl font-bold tracking-tight" />
                    </div>

                    {/* Footer: Label & Scope */}
                    <div className="space-y-1">
                        <div className="text-sm font-medium text-muted-foreground">
                            {label}
                        </div>
                        <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-[10px] font-normal bg-muted text-muted-foreground hover:bg-muted/80 px-1.5 py-0">
                                {scope}
                            </Badge>
                            {trend && (
                                <span className={cn("text-[10px] font-medium", trend.positive ? "text-green-600" : "text-red-600")}>
                                    {trend.positive ? "↑" : "↓"} {trend.value} {trend.label}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
