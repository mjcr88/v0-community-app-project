"use client"

import Image from "next/image"

export function MapHighlighterCard() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12">
            {/* Heading */}
            <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-4xl font-bold">Map: Know the lay of the land</h2>
                <p className="text-base md:text-xl text-muted-foreground mt-2">
                    Explore the land. Find amenities, lots, and friends from above.
                </p>
            </div>

            {/* Content area - Split layout */}
            <div className="flex-1 w-full flex items-center justify-center max-w-6xl max-h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full h-full">
                    {/* Left: Map screenshot */}
                    <div className="relative w-full h-full min-h-[200px] rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl bg-muted/20">
                        <Image
                            src="/artifacts/map.png"
                            alt="Community map showing terrain"
                            fill
                            className="object-contain p-1"
                            priority
                        />
                        {/* Label overlay */}
                        <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm border border-border/50">
                            Interactive Map
                        </div>
                    </div>

                    {/* Right: Location Detail */}
                    <div className="relative w-full h-[200px] md:h-full min-h-[200px] shrink-0 rounded-xl overflow-hidden border-2 border-primary/20 shadow-xl bg-muted/20 order-2 md:order-2">
                        <Image
                            src="/artifacts/location_page.png"
                            alt="Location details"
                            fill
                            className="object-cover md:object-contain p-1"
                            priority
                        />
                        {/* Label overlay */}
                        <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm border border-border/50">
                            Location Details
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
