"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageLightbox } from "./ImageLightbox"

interface PhotoGallerySectionProps {
    photos: (string | { url: string })[]
    residentName: string
}

export function PhotoGallerySection({ photos, residentName }: PhotoGallerySectionProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    // Convert photos to string array
    const photoUrls = photos.map(p => typeof p === 'string' ? p : p?.url || '/placeholder.svg')

    const handlePhotoClick = (index: number) => {
        setCurrentIndex(index)
        setLightboxOpen(true)
    }

    if (photos.length === 0) return null

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Photos</CardTitle>
                    <CardDescription>
                        {photos.length} photo{photos.length === 1 ? '' : 's'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                        {photos.map((photo, index) => (
                            <button
                                key={index}
                                onClick={() => handlePhotoClick(index)}
                                className="aspect-square rounded-lg overflow-hidden relative cursor-pointer group"
                            >
                                <Image
                                    src={typeof photo === 'string' ? photo : photo?.url || '/placeholder.svg'}
                                    alt={`${residentName} - Photo ${index + 1}`}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform"
                                />
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

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
