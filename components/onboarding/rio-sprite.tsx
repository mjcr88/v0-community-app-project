"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface RioSpriteProps {
    /** Path to sprite sheet image (relative to /public) */
    src: string
    /** Grid dimensions: columns x rows (e.g., 3x3 = 9 frames) */
    grid: { cols: number; rows: number }
    /** Animation speed in milliseconds per frame (default 600ms) */
    speed?: number
    /** Whether to loop the animation (default true) */
    loop?: boolean
    /** Custom className for sizing/positioning */
    className?: string
    /** Alt text for accessibility */
    alt?: string
}

export function RioSprite({
    src,
    grid,
    speed = 600,
    loop = true,
    className,
    alt = "Río the sloth"
}: RioSpriteProps) {
    const { cols, rows } = grid
    const totalFrames = cols * rows
    const [currentFrame, setCurrentFrame] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentFrame((prev) => {
                const next = prev + 1
                if (next >= totalFrames) {
                    return loop ? 0 : prev
                }
                return next
            })
        }, speed)

        return () => clearInterval(interval)
    }, [speed, totalFrames, loop])

    // Calculate position for current frame
    const row = Math.floor(currentFrame / cols)
    const col = currentFrame % cols

    // Calculate background position as percentage
    const xPos = cols === 1 ? 0 : (col / (cols - 1)) * 100
    const yPos = rows === 1 ? 0 : (row / (rows - 1)) * 100

    return (
        <div
            className={cn(
                "rio-sprite-container relative",
                className
            )}
            style={{
                backgroundImage: `url(${src})`,
                backgroundSize: `${cols * 100}% ${rows * 100}%`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `${xPos}% ${yPos}%`,
            }}
            role="img"
            aria-label={alt}
        />
    )
}
