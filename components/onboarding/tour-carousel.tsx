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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-7xl h-[95vh] mx-4">
                {/* Close button - hide on last slide */}
                {currentSlide < totalSlides - 1 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                )}

                {/* Progress indicator */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white z-10">
                    <span className="text-sm font-medium">
                        {currentSlide + 1} / {totalSlides}
                    </span>
                    <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Card container with animation */}
                <div className="h-full flex flex-col justify-center pt-16 pb-24">
                    <div className="relative w-full h-full bg-background rounded-3xl overflow-hidden shadow-2xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="h-full w-full"
                            >
                                {cards[currentSlide]}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-between px-8">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentSlide === 0}
                        className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Button
                        onClick={handleNext}
                        className="gap-2 bg-primary hover:bg-primary/90"
                    >
                        {currentSlide === totalSlides - 1 ? "Complete Tour" : "Next"}
                        {currentSlide < totalSlides - 1 && <ChevronRight className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
