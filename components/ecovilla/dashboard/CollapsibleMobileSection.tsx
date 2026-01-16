"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardAnalytics } from "@/lib/analytics"

interface CollapsibleMobileSectionProps {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
}

export function CollapsibleMobileSection({ title, children, defaultOpen = true }: CollapsibleMobileSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // On desktop, always show expanded (no collapsing)
    if (!isMobile) {
        return (
            <div className="space-y-3">
                <h3 className="text-lg font-semibold">{title}</h3>
                {children}
            </div>
        )
    }

    // On mobile, show collapsible
    return (
        <div className="space-y-3">
            <button
                onClick={() => {
                    const newValue = !isOpen
                    setIsOpen(newValue)
                    DashboardAnalytics.mobileSectionToggled(title, newValue)
                }}
                className="flex items-center justify-between w-full text-left"
            >
                <h3 className="text-lg font-semibold">{title}</h3>
                <ChevronDown
                    className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
            </button>
            {isOpen && <div>{children}</div>}
        </div>
    )
}
