"use client"

import { forwardRef, useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { AnimatedBeam } from "@/components/library/animated-beam"
import { AnimatedThemeToggler } from "@/components/library/animated-theme-toggler"
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

export function ThemeToggleCard() {
    const [isDark, setIsDark] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const centerRef = useRef<HTMLDivElement>(null)
    const requestsRef = useRef<HTMLDivElement>(null)
    const exchangeRef = useRef<HTMLDivElement>(null)
    const eventsRef = useRef<HTMLDivElement>(null)
    const checkinsRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<HTMLDivElement>(null)
    const directoryRef = useRef<HTMLDivElement>(null)

    // Sync with actual theme
    useEffect(() => {
        const updateTheme = () => {
            setIsDark(document.documentElement.classList.contains("dark"))
        }

        updateTheme()

        const observer = new MutationObserver(updateTheme)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        })

        return () => observer.disconnect()
    }, [])

    return (
        <div className="h-full w-full flex flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12 bg-background">
            {/* Heading */}
            <div className="text-center mb-6 md:mb-8">
                <h2 className="text-2xl md:text-4xl font-bold">Your app, your style</h2>
                <p className="text-base md:text-xl text-muted-foreground mt-2">
                    Early bird or night owl? Choose the look that suits your eyes.
                </p>
            </div>

            {/* Theme Toggle Button */}
            <div className="flex-shrink-0 mb-6 md:mb-8">
                <AnimatedThemeToggler
                    duration={600}
                    className="
            h-12 md:h-14 px-6 md:px-8 rounded-full border-2 
            bg-background hover:bg-accent
            transition-colors duration-200
            flex items-center gap-3
            text-sm md:text-base font-medium
            shadow-lg
          "
                >
                    {isDark ? "Light Mode" : "Dark Mode"}
                </AnimatedThemeToggler>
            </div>

            {/* Beam Component - same as Card 1 */}
            <div className="flex-1 w-full flex items-center justify-center max-w-5xl max-h-[500px]">
                <div
                    ref={containerRef}
                    className="relative w-full h-full flex items-center justify-center"
                >
                    {/* Center: ESM */}
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

                    {/* Animated Beams */}
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
