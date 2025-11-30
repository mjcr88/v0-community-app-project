"use client"

import { Card, CardContent } from "@/components/library/card"
import { Button } from "@/components/library/button"
import { Badge } from "@/components/library/badge"
import { Edit2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { NumberTicker } from "@/components/library/number-ticker"

interface StatCardProps {
    value: number
    label: string
    scope: "Personal" | "Neighborhood" | "Community"
    onEdit: () => void
    className?: string
}

const scopeConfig = {
    Personal: { icon: "👤", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    Neighborhood: { icon: "🏡", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
    Community: { icon: "🏙️", color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
}

export function StatCard({ value, label, scope, onEdit, className }: StatCardProps) {
    const scopeInfo = scopeConfig[scope]

    return (
        <Card
            className={cn(
                "relative group transition-all hover:shadow-md hover:-translate-y-0.5",
                className
            )}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="text-4xl font-bold">
                        <NumberTicker value={value} className="text-4xl font-bold" />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onEdit}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <Badge variant="secondary" className={cn("text-xs", scopeInfo.color)}>
                        {scopeInfo.icon} {scope}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    )
}
