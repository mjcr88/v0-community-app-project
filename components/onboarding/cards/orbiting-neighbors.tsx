"use client"

import { OrbitingCircles } from "@/components/library/orbiting-circles"
import Image from "next/image"

export function OrbitingNeighborsCard() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12">
            {/* Heading */}
            <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-4xl font-bold">Neighbor directory: Find your tribe</h2>
                <p className="text-base md:text-xl text-muted-foreground mt-2">
                    Looking for gardeners or playdates? Connect with neighbors who share your passions.
                </p>
            </div>

            {/* Content area - centered orbits */}
            <div className="flex-1 w-full flex items-center justify-center max-w-5xl max-h-[500px] overflow-visible">
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Center: ESM logo */}
                    <div className="relative z-10 flex h-24 w-24 md:h-32 md:w-32 items-center justify-center rounded-full border-2 border-primary bg-background shadow-2xl">
                        <div className="text-lg md:text-2xl font-bold text-primary">ESM</div>
                    </div>

                    {/* Inner orbit - 4 avatars - increased radius */}
                    {/* Inner Circle - 4 items */}
                    <OrbitingCircles
                        className="h-12 w-12 md:h-16 md:w-16 border-2 border-primary/30 bg-background"
                        duration={20}
                        radius={80}
                    >
                        <div className="relative h-full w-full rounded-full overflow-hidden">
                            <Image src="/Sample Avatars/cropped_circle_image (1).png" alt="Avatar" fill className="object-cover" />
                        </div>
                        <div className="relative h-full w-full rounded-full overflow-hidden">
                            <Image src="/Sample Avatars/cropped_circle_image (2).png" alt="Avatar" fill className="object-cover" />
                        </div>
                        <div className="relative h-full w-full rounded-full overflow-hidden">
                            <Image src="/Sample Avatars/cropped_circle_image (3).png" alt="Avatar" fill className="object-cover" />
                        </div>
                        <div className="relative h-full w-full rounded-full overflow-hidden">
                            <Image src="/Sample Avatars/cropped_circle_image (4).png" alt="Avatar" fill className="object-cover" />
                        </div>
                    </OrbitingCircles>

                    {/* Outer Circle - 3 items */}
                    <OrbitingCircles
                        className="h-12 w-12 md:h-16 md:w-16 border-2 border-primary/30 bg-background"
                        duration={25}
                        radius={160}
                        reverse
                    >
                        <div className="relative h-full w-full rounded-full overflow-hidden">
                            <Image src="/Sample Avatars/cropped_circle_image (5).png" alt="Avatar" fill className="object-cover" />
                        </div>
                        <div className="relative h-full w-full rounded-full overflow-hidden">
                            <Image src="/Sample Avatars/cropped_circle_image (6).png" alt="Avatar" fill className="object-cover" />
                        </div>
                        <div className="relative h-full w-full rounded-full overflow-hidden">
                            <Image src="/Sample Avatars/cropped_circle_image.png" alt="Avatar" fill className="object-cover" />
                        </div>
                    </OrbitingCircles>
                </div>
            </div>
        </div>
    )
}
