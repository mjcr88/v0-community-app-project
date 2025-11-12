"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface EventImage {
  id: string
  image_url: string
  is_hero: boolean
  display_order: number
}

interface EventImagesGalleryProps {
  images: EventImage[]
}

export function EventImagesGallery({ images }: EventImagesGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({})
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({})

  if (!images || images.length === 0) {
    return null
  }

  const heroImage = images.find((img) => img.is_hero)
  const otherImages = images.filter((img) => !img.is_hero)
  const allImages = heroImage ? [heroImage, ...otherImages] : otherImages

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handlePrevious = () => {
    if (selectedImageIndex === null) return
    setSelectedImageIndex((selectedImageIndex - 1 + allImages.length) % allImages.length)
  }

  const handleNext = () => {
    if (selectedImageIndex === null) return
    setSelectedImageIndex((selectedImageIndex + 1) % allImages.length)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious()
    if (e.key === "ArrowRight") handleNext()
    if (e.key === "Escape") setSelectedImageIndex(null)
  }

  const handleImageError = (imageId: string) => {
    setImageLoadError((prev) => ({ ...prev, [imageId]: true }))
    setImageLoading((prev) => ({ ...prev, [imageId]: false }))
  }

  const handleImageLoadStart = (imageId: string) => {
    setImageLoading((prev) => ({ ...prev, [imageId]: true }))
  }

  const handleImageLoadComplete = (imageId: string) => {
    setImageLoading((prev) => ({ ...prev, [imageId]: false }))
  }

  return (
    <>
      <div className="space-y-4">
        {/* Hero Image */}
        {heroImage && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted group cursor-pointer">
            {imageLoading[heroImage.id] && <Skeleton className="absolute inset-0 z-10" />}
            {imageLoadError[heroImage.id] ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                <p className="text-sm">Failed to load image</p>
              </div>
            ) : (
              <Image
                src={heroImage.image_url || "/placeholder.svg"}
                alt="Event hero image"
                fill
                className="object-cover transition-transform group-hover:scale-105"
                onClick={() => handleImageClick(0)}
                onLoadingComplete={() => handleImageLoadComplete(heroImage.id)}
                onLoadStart={() => handleImageLoadStart(heroImage.id)}
                onError={() => handleImageError(heroImage.id)}
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            )}
          </div>
        )}

        {/* Additional Images Grid */}
        {otherImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherImages.map((image, index) => {
              const actualIndex = heroImage ? index + 1 : index
              return (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer"
                >
                  {imageLoading[image.id] && <Skeleton className="absolute inset-0 z-10" />}
                  {imageLoadError[image.id] ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                      <p className="text-xs">Failed to load</p>
                    </div>
                  ) : (
                    <Image
                      src={image.image_url || "/placeholder.svg"}
                      alt={`Event image ${image.display_order + 1}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      onClick={() => handleImageClick(actualIndex)}
                      onLoadingComplete={() => handleImageLoadComplete(image.id)}
                      onLoadStart={() => handleImageLoadStart(image.id)}
                      onError={() => handleImageError(image.id)}
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Image count indicator */}
        {images.length > 1 && (
          <p className="text-sm text-muted-foreground text-center">
            {images.length} image{images.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
        <DialogContent
          className="max-w-[95vw] w-full h-[95vh] p-0 overflow-hidden bg-black/95 border-0"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={() => setSelectedImageIndex(null)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Navigation Buttons */}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Image Counter */}
            {allImages.length > 1 && selectedImageIndex !== null && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                {selectedImageIndex + 1} / {allImages.length}
              </div>
            )}

            {/* Selected Image */}
            {selectedImageIndex !== null && allImages[selectedImageIndex] && (
              <div className="relative w-full h-full p-8">
                <Image
                  src={allImages[selectedImageIndex].image_url || "/placeholder.svg"}
                  alt={`Event image ${selectedImageIndex + 1}`}
                  fill
                  className="object-contain"
                  quality={100}
                  sizes="95vw"
                  priority
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
