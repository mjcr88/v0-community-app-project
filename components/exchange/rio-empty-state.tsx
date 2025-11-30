"use client"

import { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface RioEmptyStateProps {
    variant?: "no-listings" | "no-matches" | "no-saved"
    title: string
    description: string
    action?: ReactNode
    className?: string
}

export function RioEmptyState({
    variant = "no-listings",
    title,
    description,
    action,
    className,
}: RioEmptyStateProps) {
    return (
        <Card
            className={cn(
                "relative overflow-hidden border-2",
                "bg-gradient-to-br from-background to-muted/20",
                className
            )}
        >
            {/* Shine border effect */}
            <div className="absolute inset-0 rounded-lg opacity-50">
                <div className="absolute inset-[-2px] rounded-lg bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 animate-shine" />
            </div>

            <div className="relative flex flex-col items-center justify-center p-12 text-center space-y-4">
                {/* Rio Illustration - Placeholder SVG */}
                <div className="relative w-48 h-48 mb-2">
                    <RioIllustration variant={variant} />
                </div>

                {/* Content */}
                <div className="space-y-2 max-w-md">
                    <h3 className="text-lg font-medium text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Optional Action */}
                {action && <div className="mt-4">{action}</div>}
            </div>
        </Card>
    )
}

// Placeholder Rio illustrations - will be replaced with actual SVGs later
function RioIllustration({ variant }: { variant: RioEmptyStateProps["variant"] }) {
    const colors = {
        primary: "hsl(var(--forest-growth))",
        secondary: "hsl(var(--sunrise))",
        accent: "hsl(var(--sky))",
    }

    // Different poses based on variant
    if (variant === "no-matches") {
        // Waiting/patient pose
        return (
            <svg
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
            >
                {/* Simple macaw silhouette - waiting pose */}
                <circle cx="100" cy="80" r="30" fill={colors.primary} opacity="0.2" />
                <ellipse cx="100" cy="120" rx="35" ry="45" fill={colors.primary} opacity="0.3" />
                <path
                    d="M 85 75 Q 80 65 75 70 M 115 75 Q 120 65 125 70"
                    stroke={colors.secondary}
                    strokeWidth="3"
                    fill="none"
                />
                <circle cx="90" cy="75" r="3" fill={colors.accent} />
                <circle cx="110" cy="75" r="3" fill={colors.accent} />
                <path d="M 95 85 Q 100 88 105 85" stroke={colors.secondary} strokeWidth="2" fill="none" />
                <text x="100" y="180" textAnchor="middle" className="text-xs fill-muted-foreground">
                    Rio is waiting...
                </text>
            </svg>
        )
    }

    // Default/general pose - friendly and welcoming
    return (
        <svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            {/* Simple macaw silhouette - friendly pose */}
            <circle cx="100" cy="80" r="32" fill={colors.primary} opacity="0.2" />
            <ellipse cx="100" cy="125" rx="38" ry="48" fill={colors.primary} opacity="0.3" />

            {/* Wings */}
            <path
                d="M 65 110 Q 45 115 40 125"
                stroke={colors.secondary}
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.4"
            />
            <path
                d="M 135 110 Q 155 115 160 125"
                stroke={colors.secondary}
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.4"
            />

            {/* Face */}
            <circle cx="88" cy="75" r="4" fill={colors.accent} />
            <circle cx="112" cy="75" r="4" fill={colors.accent} />
            <path d="M 93 88 Q 100 92 107 88" stroke={colors.secondary} strokeWidth="3" fill="none" />

            {/* Beak */}
            <path d="M 100 80 L 100 88" stroke={colors.secondary} strokeWidth="2" />

            <text x="100" y="185" textAnchor="middle" className="text-xs fill-muted-foreground">
                Rio the Macaw
            </text>
        </svg>
    )
}
