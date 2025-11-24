"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface StatConfig {
    id: string
    label: string
    value: string | number
    scope: string
    icon?: React.ReactNode
    trend?: {
        value: number
        direction: "up" | "down" | "neutral"
    }
}

interface StatCardProps {
    stat: StatConfig
    isEditing?: boolean
    onEdit?: () => void
    className?: string
}

export function StatCard({ stat, isEditing, onEdit, className }: StatCardProps) {
    return (
        <Card className={cn("relative overflow-hidden p-4 flex flex-col justify-between h-full group hover:shadow-md transition-all", className)}>
            <div className="flex items-start justify-between">
                <div className="text-4xl font-bold tracking-tight text-foreground">
                    {stat.value ?? 0}
                </div>
                {isEditing && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit?.()
                        }}
                    >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                )}
            </div>

            <div className="mt-2">
                <div className="text-sm font-medium text-muted-foreground leading-tight">
                    {stat.label}
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-muted text-muted-foreground hover:bg-muted border-none">
                        {stat.scope}
                    </Badge>
                    {stat.trend && (
                        <span className={cn(
                            "text-[10px] font-medium flex items-center gap-0.5",
                            stat.trend.direction === "up" ? "text-green-600" :
                                stat.trend.direction === "down" ? "text-red-600" : "text-muted-foreground"
                        )}>
                            {stat.trend.direction === "up" ? "↑" : stat.trend.direction === "down" ? "↓" : "→"}
                            {Math.abs(stat.trend.value)}%
                        </span>
                    )}
                </div>
            </div>
        </Card>
    )
}
