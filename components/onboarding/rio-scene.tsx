"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface RioSceneProps {
    pose: string // Folder name in /rio_tour
    frames?: number // Number of frames (default: 3)
    interval?: number // Animation speed in ms
    className?: string
}

export function RioScene({ pose, frames = 3, interval = 800, className = "" }: RioSceneProps) {
    const [currentFrame, setCurrentFrame] = useState(1)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentFrame((prev) => prev % frames + 1)
        }, interval)

        return () => clearInterval(timer)
    }, [interval, frames])

    const framePath = `/rio_tour/${pose}/${currentFrame}.png`

    return (
        <div className={`relative w-[200px] h-[200px] flex items-center justify-center ${className}`}>
            <Image
                src={framePath}
                alt={`Río ${pose} animation frame ${currentFrame}`}
                width={200}
                height={200}
                className="object-contain"
                priority
            />
        </div>
    )
}
