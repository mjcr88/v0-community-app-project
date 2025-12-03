"use client"

import { OrbitingCircles } from "@/components/library/orbiting-circles"

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
            <div className="flex-1 w-full flex items-center justify-center max-w-5xl max-h-[500px]">
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Center: ESM logo */}
                    <div className="relative z-10 flex h-24 w-24 md:h-32 md:w-32 items-center justify-center rounded-full border-2 border-primary bg-background shadow-2xl">
                        <div className="text-lg md:text-2xl font-bold text-primary">ESM</div>
                    </div>

                    {/* Inner orbit - 4 avatars - increased radius */}
                    <OrbitingCircles
                        className="h-12 w-12 md:h-16 md:w-16 border-2 border-primary/30"
                        duration={20}
                        radius={120}
                    >
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
                            MJ
                        </div>
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
                            SA
                        </div>
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
                            LK
                        </div>
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
                            TC
                        </div>
                    </OrbitingCircles>

                    {/* Outer orbit - 3 avatars - much larger radius */}
                    <OrbitingCircles
                        className="h-14 w-14 md:h-18 md:w-18 border-2 border-primary/30"
                        duration={30}
                        radius={200}
                        reverse
                    >
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
                            EM
                        </div>
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
                            JD
                        </div>
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
                            BR
                        </div>
                    </OrbitingCircles>
                </div>
            </div>
        </div>
    )
}
