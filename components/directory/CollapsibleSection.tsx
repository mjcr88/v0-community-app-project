"use client"

import { useState, useEffect } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChevronDown,
    User,
    Languages,
    Mail,
    IdCard,
    Heart,
    Lightbulb,
    Image,
    Users,
    PawPrint,
    MapPin,
    Package
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CollapsibleSectionProps {
    title: string
    iconName: string
    children: React.ReactNode
    defaultOpen?: boolean
    className?: string
    description?: string
}

// Map icon names to icon components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    User,
    Languages,
    Mail,
    IdCard,
    Heart,
    Lightbulb,
    Image,
    Users,
    PawPrint,
    MapPin,
    Package
}

export function CollapsibleSection({ title, iconName, children, defaultOpen = false, className, description }: CollapsibleSectionProps) {
    const Icon = iconMap[iconName] || User
    const [isDesktop, setIsDesktop] = useState(false)

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
        checkDesktop()
        window.addEventListener('resize', checkDesktop)
        return () => window.removeEventListener('resize', checkDesktop)
    }, [])

    // On desktop, all sections are open by default
    // On mobile, only sections with defaultOpen=true are open
    const shouldBeOpen = isDesktop || defaultOpen

    return (
        <Collapsible defaultOpen={shouldBeOpen}>
            <Card className={className}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon className="h-5 w-5" />
                                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        </div>
                        {description && <CardDescription>{description}</CardDescription>}
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent>
                        {children}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}
