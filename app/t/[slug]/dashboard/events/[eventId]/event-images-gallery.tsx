"use client"

import Image from "next/image"
import { SharedPhotoGallery } from "@/components/shared/SharedPhotoGallery"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"

interface EventImage {
  id: string
  image_url: string
  is_hero: boolean
  display_order: number
}

interface EventHeroImageProps {
  heroImage?: EventImage | null
  fallbackImage?: string
  alt: string
}

export function EventHeroImage({ heroImage, fallbackImage = "/placeholder.svg", alt }: EventHeroImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  if (!heroImage && !fallbackImage) return null

  const imageUrl = heroImage?.image_url || fallbackImage

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted border border-border/50 shadow-sm">
      {isLoading && <Skeleton className="absolute inset-0 z-10" />}
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-cover"
        priority
        onLoadingComplete={() => setIsLoading(false)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
      />
    </div>
  )
}

interface EventPhotoGalleryProps {
  images: EventImage[]
  eventTitle: string
}

export function EventPhotoGallery({ images, eventTitle }: EventPhotoGalleryProps) {
  // Filter out hero image if it exists, or just show all if no hero flag (though usually we separate them)
  // Based on requirement: "display the hero image above... place [gallery] under..."
  // So we should exclude the hero image from this gallery if it's already shown as hero.
  const otherImages = images.filter(img => !img.is_hero)

  if (otherImages.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Photos</h3>
      <SharedPhotoGallery photos={otherImages} altPrefix={eventTitle} />
    </div>
  )
}

