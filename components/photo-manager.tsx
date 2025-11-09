"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Loader2, X, Star } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PhotoManagerProps {
  photos: string[]
  heroPhoto: string | null
  onPhotosChange: (photos: string[]) => void
  onHeroPhotoChange: (heroPhoto: string | null) => void
  maxPhotos?: number
  entityType?: "location" | "family" | "user" | "pet" | "neighborhood"
}

export function PhotoManager({
  photos,
  heroPhoto,
  onPhotosChange,
  onHeroPhotoChange,
  maxPhotos = 20,
  entityType = "location",
}: PhotoManagerProps) {
  const [uploading, setUploading] = useState(false)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (photos.length + files.length > maxPhotos) {
      toast({
        title: "Too many photos",
        description: `Maximum ${maxPhotos} photos allowed. You can upload ${maxPhotos - photos.length} more.`,
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Upload failed")
        }

        const data = await response.json()
        return data.url
      })

      const urls = await Promise.all(uploadPromises)
      const newPhotos = [...photos, ...urls]
      onPhotosChange(newPhotos)

      // If this is the first photo and no hero is set, set it as hero
      if (photos.length === 0 && !heroPhoto && urls.length > 0) {
        onHeroPhotoChange(urls[0])
      }

      toast({
        title: "Upload successful",
        description: `${urls.length} photo${urls.length > 1 ? "s" : ""} uploaded successfully`,
      })
    } catch (error) {
      console.error("[v0] Photo upload error:", error)
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload photos",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const removePhoto = (urlToRemove: string) => {
    const newPhotos = photos.filter((url) => url !== urlToRemove)
    onPhotosChange(newPhotos)

    // If removing the hero photo, set a new hero if photos remain
    if (heroPhoto === urlToRemove) {
      onHeroPhotoChange(newPhotos.length > 0 ? newPhotos[0] : null)
    }

    toast({
      description: "Photo removed",
    })
  }

  const setAsHero = (url: string) => {
    onHeroPhotoChange(url)
    toast({
      description: "Hero photo updated",
    })
  }

  const getEntityLabel = () => {
    const labels = {
      location: "location",
      family: "family",
      user: "profile",
      pet: "pet",
      neighborhood: "neighborhood",
    }
    return labels[entityType] || "item"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label>
            Photos ({photos.length}/{maxPhotos})
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Upload photos for this {getEntityLabel()}. Click the star to set a hero image.
          </p>
        </div>
      </div>

      {/* Upload Button */}
      <div>
        <Input
          id="photo-upload"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handlePhotoUpload}
          disabled={uploading || photos.length >= maxPhotos}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("photo-upload")?.click()}
          disabled={uploading || photos.length >= maxPhotos}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photos
            </>
          )}
        </Button>
      </div>

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((url) => {
            const isHero = url === heroPhoto

            return (
              <Card
                key={url}
                className={cn(
                  "relative group aspect-square overflow-hidden",
                  isHero && "ring-2 ring-primary ring-offset-2",
                )}
              >
                <img src={url || "/placeholder.svg"} alt="Upload" className="w-full h-full object-cover" />

                {/* Hero Badge */}
                {isHero && (
                  <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground shadow-lg">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Hero
                  </Badge>
                )}

                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {!isHero && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={() => setAsHero(url)}
                      className="h-8 w-8 shadow-lg"
                      title="Set as hero photo"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removePhoto(url)}
                    className="h-8 w-8 shadow-lg"
                    title="Remove photo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-2 border-dashed">
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Upload className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm font-medium">No photos uploaded</p>
            <p className="text-xs mt-1">Click Upload Photos to get started</p>
          </div>
        </Card>
      )}

      {/* Helper Text */}
      {photos.length > 0 && !heroPhoto && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <Star className="h-4 w-4 inline mr-1" />
          Click the star icon on a photo to set it as the hero image
        </p>
      )}
    </div>
  )
}
