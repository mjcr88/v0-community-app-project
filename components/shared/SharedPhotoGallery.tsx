"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageLightbox } from "@/components/directory/ImageLightbox"
import { cn } from "@/lib/utils"

interface SharedPhotoGalleryProps {
    photos: (string | { url?: string; image_url?: string } | any)[]
    altPrefix?: string
    className?: string
    columns?: number
}

export function SharedPhotoGallery({ photos, altPrefix = "Image", className, columns = 3 }: SharedPhotoGalleryProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    if (!photos || photos.length === 0) return null

    // Normalize photos to string array for Lightbox
    const photoUrls = photos.map(p => {
        if (typeof p === 'string') return p
        return p.url || p.image_url || '/placeholder.svg'
    }).filter(url => url && url !== '/placeholder.svg')

    if (photoUrls.length === 0) return null

    const handlePhotoClick = (index: number) => {
        setCurrentIndex(index)
        setLightboxOpen(true)
    }

    return (
        <>
            <div className={cn("grid gap-3", {
                "grid-cols-2": columns === 2,
                "grid-cols-3": columns === 3,
                "grid-cols-4": columns === 4,
                "sm:grid-cols-3 md:grid-cols-4": !columns // Responsive default
            }, className)}>
                {photoUrls.map((photo, index) => (
                    <button
                        key={index}
                        onClick={() => handlePhotoClick(index)}
                        className="aspect-square rounded-lg overflow-hidden relative cursor-pointer group bg-muted border border-border/50"
                    >
                        <Image
                            src={photo}
                            alt={`${altPrefix} - Photo ${index + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </button>
                ))}
            </div>

            <ImageLightbox
                images={photoUrls}
                currentIndex={currentIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                onNext={() => setCurrentIndex(prev => Math.min(prev + 1, photoUrls.length - 1))}
                onPrevious={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
            />
        </>
    )
}
