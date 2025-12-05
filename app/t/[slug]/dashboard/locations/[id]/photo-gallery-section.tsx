"use client"

import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, Image as ImageIcon } from "lucide-react"
import { LocationPhotoGallery } from "@/components/locations/location-photo-gallery"

interface PhotoGallerySectionProps {
    photos: string[]
    heroPhoto: string | null
    locationName: string
}

export function PhotoGallerySection({ photos, heroPhoto, locationName }: PhotoGallerySectionProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                <CardTitle className="text-lg font-semibold">Photo Gallery</CardTitle>
                            </div>
                            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <LocationPhotoGallery
                            photos={photos}
                            heroPhoto={heroPhoto}
                            locationName={locationName}
                        />
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}
