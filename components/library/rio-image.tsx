"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type RioPose = "general" | "encouraging" | "waiting" | "icon"
type RioSize = "sm" | "md" | "lg" | "xl"

interface RioImageProps {
    pose?: RioPose
    size?: RioSize
    className?: string
    alt?: string
}

const sizeMap: Record<RioSize, number> = {
    sm: 48,
    md: 100,
    lg: 200,
    xl: 300,
}

const poseMap: Record<RioPose, string> = {
    general: "/images/rio-general.png",
    encouraging: "/images/rio-encouraging.png",
    waiting: "/images/rio-waiting.png",
    icon: "/images/rio-icon.png",
}

export function RioImage({
    pose = "general",
    size = "lg",
    className,
    alt = "Rio the Macaw"
}: RioImageProps) {
    const dimension = sizeMap[size]
    const imagePath = poseMap[pose]

    return (
        <div
            className={cn(
                "relative flex items-center justify-center",
                "animate-in fade-in-50 zoom-in-95 duration-500",
                className
            )}
            style={{
                width: dimension,
                height: dimension,
            }}
        >
            <Image
                src={imagePath}
                alt={alt}
                width={dimension}
                height={dimension}
                className="object-contain"
                priority={size === "lg" || size === "xl"}
            />
        </div>
    )
}
