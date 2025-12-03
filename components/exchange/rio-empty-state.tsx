"use client"

import { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import Image from "next/image"

interface RioEmptyStateProps {
    variant?: "no-listings" | "no-matches" | "no-saved" | "no-requests" | "no-upcoming" | "no-past" | "no-rsvp"
    title: string
    description: string
    action?: ReactNode
    className?: string
    imageSrc?: string
}

export function RioEmptyState({
    variant = "no-listings",
    title,
    description,
    action,
    className,
    imageSrc: customImageSrc,
}: RioEmptyStateProps) {
    const imageMap = {
        "no-listings": "/rio/rio_empty_basket.png",
        "no-requests": "/rio/rio_taking_request.png",
        "no-matches": "/rio/rio_no_results_confused.png",
        "no-saved": "/rio/parrot.png",
        "no-upcoming": "/rio/rio_no_upcoming_events.png",
        "no-past": "/rio/rio_past_events_photo_album.png",
        "no-rsvp": "/rio/rio_rsvp.png",
    }

    const imageSrc = customImageSrc || imageMap[variant] || "/rio/parrot.png"

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-12 text-center px-4",
                className
            )}
        >
            <div className="relative w-56 h-56 mb-6">
                <Image
                    src={imageSrc}
                    alt="Río the Macaw"
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            <div className="space-y-2 max-w-md">
                <h3 className="text-xl font-bold text-foreground">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </div>

            {/* Optional Action */}
            {action && <div className="mt-6">{action}</div>}
        </div>
    )
}
