"use client"

import { ReactNode } from "react"

type LayoutType = "bento" | "hero"

interface TourCardProps {
    layout?: LayoutType
    heading: string
    body: string
    visual: ReactNode
    rio: ReactNode
    className?: string
}

export function TourCard({
    layout = "bento",
    heading,
    body,
    visual,
    rio,
    className = "",
}: TourCardProps) {
    if (layout === "hero") {
        // Hero layout: Full-width for animation-heavy cards
        return (
            <div className={`h-full flex flex-col items-center justify-center gap-8 p-8 ${className}`}>
                {/* Visual takes center stage */}
                <div className="flex-1 w-full flex items-center justify-center">
                    {visual}
                </div>

                {/* Content below */}
                <div className="w-full max-w-2xl text-center space-y-4">
                    <h2 className="text-3xl md:text-4xl font-bold">{heading}</h2>
                    <p className="text-lg text-muted-foreground">{body}</p>
                </div>

                {/* Río at bottom */}
                <div className="flex justify-center">
                    {rio}
                </div>
            </div>
        )
    }

    // Bento layout: Desktop grid, mobile stack
    return (
        <div className={`h-full ${className}`}>
            {/* Desktop: Bento grid */}
            <div className="hidden md:grid md:grid-cols-2 gap-8 h-full p-8">
                {/* Left: Visual */}
                <div className="flex items-center justify-center">
                    {visual}
                </div>

                {/* Right: Content + Río */}
                <div className="flex flex-col justify-center space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold">{heading}</h2>
                        <p className="text-lg text-muted-foreground">{body}</p>
                    </div>
                    <div className="flex justify-start">
                        {rio}
                    </div>
                </div>
            </div>

            {/* Mobile: Stack */}
            <div className="md:hidden flex flex-col items-center gap-6 h-full p-6 overflow-y-auto">
                <div className="w-full flex items-center justify-center">
                    {visual}
                </div>
                <div className="w-full text-center space-y-4">
                    <h2 className="text-2xl font-bold">{heading}</h2>
                    <p className="text-base text-muted-foreground">{body}</p>
                </div>
                <div className="flex justify-center">
                    {rio}
                </div>
            </div>
        </div>
    )
}
