"use client"

import Image from "next/image"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface RioEmptyStateProps {
    title?: string
    message?: string
    action?: ReactNode
    imageSize?: number
    className?: string
}

export function RioEmptyState({
    title = "No items found",
    message,
    action,
    imageSize = 128,
    className,
}: RioEmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center text-center py-8 bg-card rounded-xl", className)}>
            <div className="relative mb-4">
                <Image
                    src="/rio/rio_no_results_confused.png"
                    alt="Rio is confused because there are no items here"
                    width={imageSize}
                    height={imageSize}
                    className="object-contain"
                    priority
                />
            </div>

            <h3 className="text-lg font-semibold mb-2">{title}</h3>

            {message && (
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                    {message}
                </p>
            )}

            {action && (
                <div className="flex items-center justify-center gap-2 mt-2">
                    {action}
                </div>
            )}
        </div>
    )
}
