"use client"

import React from "react"
import { ArrowRight, Calendar, Megaphone, MapPin } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/library/card"
import { Button } from "@/components/library/button"
import { Badge } from "@/components/library/badge"
import { cn } from "@/lib/utils"

export interface PriorityItem {
    id: string
    type: "announcement" | "event" | "check-in" | "poll"
    title: string
    description: string
    date?: string
    location?: string
    isUrgent?: boolean
    actionLabel?: string
    onAction?: () => void
}

interface PriorityHeroCardProps {
    item: PriorityItem
    className?: string
}

const typeIcons = {
    announcement: Megaphone,
    event: Calendar,
    "check-in": MapPin,
    poll: Megaphone, // Fallback
}

const typeColors = {
    announcement: "bg-orange-100 text-orange-700 border-orange-200",
    event: "bg-blue-100 text-blue-700 border-blue-200",
    "check-in": "bg-green-100 text-green-700 border-green-200",
    poll: "bg-purple-100 text-purple-700 border-purple-200",
}

export function PriorityHeroCard({ item, className }: PriorityHeroCardProps) {
    const Icon = typeIcons[item.type] || Megaphone

    return (
        <Card className={cn("border-2 border-primary/20 shadow-lg bg-gradient-to-br from-card to-primary/5", className)}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <Badge
                        variant="outline"
                        className={cn("capitalize flex items-center gap-1", typeColors[item.type])}
                    >
                        <Icon className="w-3 h-3" />
                        {item.type}
                    </Badge>
                    {item.isUrgent && (
                        <Badge variant="destructive" className="animate-pulse">
                            Urgent
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                <h3 className="text-2xl font-bold tracking-tight mb-2 text-foreground">
                    {item.title}
                </h3>
                <p className="text-muted-foreground line-clamp-2">
                    {item.description}
                </p>

                {(item.date || item.location) && (
                    <div className="flex flex-wrap gap-3 mt-4 text-sm text-muted-foreground">
                        {item.date && (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{item.date}</span>
                            </div>
                        )}
                        {item.location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{item.location}</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full group"
                    onClick={item.onAction}
                >
                    {item.actionLabel || "View Details"}
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
            </CardFooter>
        </Card>
    )
}
