"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface TourCarouselProps {
    cards: React.ReactNode[]
    onComplete: () => void
    onClose: () => void
}

export function TourCarousel({ cards, onComplete, onClose }: TourCarouselProps) {
    const [currentSlide, setCurrentSlide] = useState(0)
    const totalSlides = cards.length

    const handleNext = () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(currentSlide + 1)
        } else {
            onComplete()
        }
    }

    const handleBack = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1)
        }
    }

    const progress = ((currentSlide + 1) / totalSlides) * 100

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm h-[100dvh]">
            {/* Top Bar: Progress & Close */}
            <div className="flex-none h-16 px-4 md:px-8 flex items-center justify-between relative z-50">
                {/* Progress Indicator (Centered) */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 text-muted-foreground">
                    <span className="text-sm font-medium tabular-nums">
                        {currentSlide + 1} / {totalSlides}
                    </span>
                    <div className="w-24 md:w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Close Button (Right) */}
                <div className="ml-auto">
                    {currentSlide < totalSlides - 1 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                            onClick={onClose}
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Middle: Content Card */}
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 overflow-hidden py-2">
                <div className="w-full h-full bg-card border rounded-3xl overflow-hidden shadow-2xl relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="h-full w-full overflow-y-auto"
                        >
                            {cards[currentSlide]}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Bar: Navigation Buttons */}
            <div className="flex-none h-20 px-8 md:px-12 flex items-center justify-between w-full max-w-7xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentSlide === 0}
                    className={`gap-2 text-muted-foreground hover:text-foreground hover:bg-muted ${currentSlide === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                </Button>

                <Button
                    onClick={handleNext}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 rounded-full"
                >
                    {currentSlide === totalSlides - 1 ? "Complete Tour" : "Next"}
                    {currentSlide < totalSlides - 1 && <ChevronRight className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    )
}
