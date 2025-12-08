"use client"

import { forwardRef, useRef } from "react"
import { cn } from "@/lib/utils"
import { AnimatedBeam } from "@/components/library/animated-beam"
import { WordRotate } from "@/components/library/word-rotate"
import {
    Users,
    Map,
    Calendar,
    MapPin,
    Package,
    AlertCircle
} from "lucide-react"

const Circle = forwardRef<
    HTMLDivElement,
    { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "z-10 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full border-2 bg-background shadow-lg",
                className
            )}
        >
            {children}
        </div>
    )
})
Circle.displayName = "Circle"

export function BeamIntroCard() {
    const containerRef = useRef<HTMLDivElement>(null)
    const centerRef = useRef<HTMLDivElement>(null)
    const requestsRef = useRef<HTMLDivElement>(null)
    const exchangeRef = useRef<HTMLDivElement>(null)
    const eventsRef = useRef<HTMLDivElement>(null)
    const checkinsRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<HTMLDivElement>(null)
    const directoryRef = useRef<HTMLDivElement>(null)

    return (
        <div className="h-full w-full flex flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12">
            {/* Heading with Word Rotate - 2 lines, same font size */}
            <div className="text-center mb-8 md:mb-12">
                <div className="text-2xl md:text-4xl font-bold leading-tight">
                    <div>
                        Everything you need,{" "}
                        <WordRotate
                            words={[
                                "Announcements",
                                "Neighbors",
                                "Map",
                                "Events",
                                "Check-Ins",
                                "Listings"
                            ]}
                            className="text-primary"
                            duration={1000}
                        />
                    </div>
                    <div>all in one place</div>
                </div>
            </div>

            {/* Beam Component - fills remaining space */}
            <div className="flex-1 w-full flex items-center justify-center max-w-5xl">
                <div
                    ref={containerRef}
                    className="relative w-full h-full max-h-[500px] flex items-center justify-center"
                >
                    {/* Center: ESM (no subtitle) */}
                    <Circle ref={centerRef} className="h-24 w-24 md:h-32 md:w-32 border-primary shadow-2xl z-20">
                        <div className="text-lg md:text-2xl font-bold text-primary">ESM</div>
                    </Circle>

                    {/* Left: 3 icons stacked */}
                    <div className="absolute left-0 md:left-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 md:gap-12">
                        <Circle ref={requestsRef}>
                            <AlertCircle className="h-6 w-6 md:h-8 md:w-8" />
                        </Circle>
                        <Circle ref={exchangeRef}>
                            <Package className="h-6 w-6 md:h-8 md:w-8" />
                        </Circle>
                        <Circle ref={checkinsRef}>
                            <MapPin className="h-6 w-6 md:h-8 md:w-8" />
                        </Circle>
                    </div>

                    {/* Right: 3 icons stacked */}
                    <div className="absolute right-0 md:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 md:gap-12">
                        <Circle ref={directoryRef}>
                            <Users className="h-6 w-6 md:h-8 md:w-8" />
                        </Circle>
                        <Circle ref={mapRef}>
                            <Map className="h-6 w-6 md:h-8 md:w-8" />
                        </Circle>
                        <Circle ref={eventsRef}>
                            <Calendar className="h-6 w-6 md:h-8 md:w-8" />
                        </Circle>
                    </div>

                    {/* Animated Beams - flowing FROM icons TO center */}
                    <AnimatedBeam
                        containerRef={containerRef}
                        fromRef={requestsRef}
                        toRef={centerRef}
                        gradientStartColor="#6B9B47"
                        gradientStopColor="#D97742"
                        duration={4}
                    />
                    <AnimatedBeam
                        containerRef={containerRef}
                        fromRef={exchangeRef}
                        toRef={centerRef}
                        gradientStartColor="#6B9B47"
                        gradientStopColor="#D97742"
                        duration={4}
                    />
                    <AnimatedBeam
                        containerRef={containerRef}
                        fromRef={checkinsRef}
                        toRef={centerRef}
                        gradientStartColor="#6B9B47"
                        gradientStopColor="#D97742"
                        duration={4}
                    />
                    <AnimatedBeam
                        containerRef={containerRef}
                        fromRef={directoryRef}
                        toRef={centerRef}
                        gradientStartColor="#6B9B47"
                        gradientStopColor="#D97742"
                        duration={4}
                    />
                    <AnimatedBeam
                        containerRef={containerRef}
                        fromRef={mapRef}
                        toRef={centerRef}
                        gradientStartColor="#6B9B47"
                        gradientStopColor="#D97742"
                        duration={4}
                    />
                    <AnimatedBeam
                        containerRef={containerRef}
                        fromRef={eventsRef}
                        toRef={centerRef}
                        gradientStartColor="#6B9B47"
                        gradientStopColor="#D97742"
                        duration={4}
                    />
                </div>
            </div>
        </div>
    )
}
