"use client"

import { SharedPhotoGallery } from "@/components/shared/SharedPhotoGallery"

interface PhotoGallerySectionProps {
    photos: (string | { url: string })[]
    residentName: string
}

export function PhotoGallerySection({ photos, residentName }: PhotoGallerySectionProps) {
    if (photos.length === 0) return null

    return <SharedPhotoGallery photos={photos} altPrefix={residentName} />
}
