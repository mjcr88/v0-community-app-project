"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"
import { useEffect } from "react"

interface ImageLightboxProps {
    images: string[]
    currentIndex: number
    isOpen: boolean
    onClose: () => void
    onNext?: () => void
    onPrevious?: () => void
}

export function ImageLightbox({
    images,
    currentIndex,
    isOpen,
    onClose,
    onNext,
    onPrevious,
}: ImageLightboxProps) {
    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft" && onPrevious) {
                onPrevious()
            } else if (e.key === "ArrowRight" && onNext) {
                onNext()
            } else if (e.key === "Escape") {
                onClose()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, onNext, onPrevious, onClose])

    if (images.length === 0) return null

    const currentImage = images[currentIndex]

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl h-[90vh] p-0 bg-black/95">
                {/* Hidden title for accessibility */}
                <div className="sr-only">
                    <h2>Image Gallery - Photo {currentIndex + 1} of {images.length}</h2>
                </div>

                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                    onClick={onClose}
                >
                    <X className="h-6 w-6" />
                </Button>

                {/* Image Counter */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                    {currentIndex + 1} / {images.length}
                </div>

                {/* Main Image */}
                <div className="relative w-full h-full flex items-center justify-center p-16">
                    <Image
                        src={currentImage}
                        alt={`Photo ${currentIndex + 1}`}
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Navigation Buttons */}
                {images.length > 1 && (
                    <>
                        {/* Previous */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                            onClick={onPrevious}
                            disabled={currentIndex === 0}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </Button>

                        {/* Next */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                            onClick={onNext}
                            disabled={currentIndex === images.length - 1}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </Button>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
