"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CollapsibleCardProps {
    title: string
    description?: string
    icon?: React.ElementType
    children: React.ReactNode
    defaultOpen?: boolean
}

export function CollapsibleCard({ title, description, icon: Icon, children, defaultOpen = true }: CollapsibleCardProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <Card>
            <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                        <CardTitle className="text-lg">{title}</CardTitle>
                    </div>
                    <ChevronDown
                        className={cn(
                            "h-5 w-5 text-muted-foreground transition-transform",
                            isOpen && "rotate-180"
                        )}
                    />
                </div>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            {isOpen && <CardContent>{children}</CardContent>}
        </Card>
    )
}
