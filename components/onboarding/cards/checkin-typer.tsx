"use client"

import { TypingAnimation } from "@/components/library/typing-animation"
import Image from "next/image"

export function CheckinTyperCard() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12">
            {/* Heading */}
            <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-4xl font-bold">Check-ins: Join the fun in real-time</h2>
                <p className="text-base md:text-xl text-muted-foreground mt-2">
                    Spontaneous hangouts start here. Share where you are so neighbors can join.
                </p>
            </div>

            {/* Content area - Split layout */}
            <div className="flex-1 w-full flex items-center justify-center max-w-6xl md:max-h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full md:h-full items-center">

                    {/* Left: Card View (Hidden on Mobile) + Typing Animation (Desktop only) */}
                    <div className="hidden md:flex flex-col gap-6 h-full justify-center order-2 md:order-1 relative">

                        {/* Typing Animation Bubble - Desktop */}
                        <div className="bg-primary/10 p-4 rounded-2xl rounded-tl-none border border-primary/20 self-start max-w-md">
                            <TypingAnimation
                                className="text-lg font-medium text-primary"
                                duration={50}
                                delay={1000}
                            >
                                Heading to the river! 🌊
                            </TypingAnimation>
                        </div>

                        {/* Check-in Card Image */}
                        <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl bg-muted/20 group">
                            <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full border shadow-sm">
                                <span className="text-xs font-medium text-primary">Live Status</span>
                            </div>
                            <Image
                                src="/artifacts/checkin_card.png"
                                alt="Check-in details card"
                                fill
                                className="object-contain p-1"
                                priority
                            />
                        </div>

                    </div>

                    {/* Right: Map View (and Mobile Typing Animation) */}
                    <div className="relative w-full h-full min-h-[300px] md:min-h-[250px] rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl bg-muted/20 order-1 md:order-2 group">

                        {/* Typing Animation Bubble - Mobile Only (Overlay) */}
                        <div className="absolute top-4 left-4 z-20 md:hidden bg-background/95 backdrop-blur-md p-3 rounded-2xl rounded-tl-none border border-primary/20 shadow-lg max-w-[200px]">
                            <TypingAnimation
                                className="text-sm font-medium text-primary"
                                duration={50}
                                delay={1000}
                            >
                                Heading to the river! 🌊
                            </TypingAnimation>
                        </div>

                        <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full border shadow-sm">
                            <span className="text-xs font-medium text-primary">Real-time Map</span>
                        </div>
                        <Image
                            src="/artifacts/checkin_map.png"
                            alt="Check-in map view"
                            fill
                            className="object-cover md:object-contain p-1"
                            priority
                        />
                    </div>

                </div>
            </div>
        </div>
    )
}
