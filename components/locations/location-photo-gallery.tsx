"use client"

import { SharedPhotoGallery } from "@/components/shared/SharedPhotoGallery"

interface LocationPhotoGalleryProps {
    photos: string[]
    heroPhoto: string | null
    locationName: string
}

export function LocationPhotoGallery({ photos, heroPhoto, locationName }: LocationPhotoGalleryProps) {
    if (!photos || photos.length === 0) {
        return null
    }

    // Ensure hero photo is included if it's not in the photos array
    let allPhotos = [...photos]
    if (heroPhoto && !allPhotos.includes(heroPhoto)) {
        allPhotos.unshift(heroPhoto)
    }

    // Filter out empty strings
    allPhotos = allPhotos.filter(p => p && p.trim() !== "")

    if (allPhotos.length === 0) return null

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Photos ({allPhotos.length})</h3>
            <SharedPhotoGallery photos={allPhotos} altPrefix={locationName} />
        </div>
    )
}

