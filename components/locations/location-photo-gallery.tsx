"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface LocationPhotoGalleryProps {
    photos: string[]
    heroPhoto: string | null
    locationName: string
}

export function LocationPhotoGallery({ photos, heroPhoto, locationName }: LocationPhotoGalleryProps) {
    if (!photos || photos.length === 0) {
        return null
    }

    const galleryPhotos = photos.filter((photo) => photo && photo.trim() !== "")

    if (galleryPhotos.length === 0) {
        return null
    }

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Photos ({galleryPhotos.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryPhotos.map((photo, index) => {
                    const isHero = photo === heroPhoto

                    return (
                        <div
                            key={photo}
                            className={cn(
                                "aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer group relative",
                                isHero && "ring-2 ring-primary ring-offset-2",
                            )}
                            onClick={() => window.open(photo, "_blank")}
                        >
                            <img
                                src={photo || "/placeholder.svg"}
                                alt={`${locationName} - Photo ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {isHero && (
                                <Badge className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm">
                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                    Hero
                                </Badge>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
