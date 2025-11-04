"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Map, Upload, X, ImageIcon } from "lucide-react"

export default function CreateNeighborhoodForm({ slug, tenantId }: { slug: string; tenantId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingPhoto(true)

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
      setUploadedPhotos([...uploadedPhotos, ...urls])

      toast({
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
      setUploadingPhoto(false)
      e.target.value = ""
    }
  }

  const removePhoto = (urlToRemove: string) => {
    setUploadedPhotos(uploadedPhotos.filter((url) => url !== urlToRemove))
    toast({
      description: "Photo removed",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log("[v0] Starting neighborhood creation...")

    try {
      const supabase = createBrowserClient()

      console.log("[v0] Inserting neighborhood:", formData)

      const { data: newNeighborhood, error: insertError } = await supabase
        .from("neighborhoods")
        .insert({
          tenant_id: tenantId,
          name: formData.name,
          description: formData.description,
          photos: uploadedPhotos.length > 0 ? uploadedPhotos : null,
        })
        .select()
        .single()

      if (insertError) {
        console.log("[v0] Insert error:", insertError)
        throw insertError
      }

      console.log("[v0] Neighborhood created successfully:", newNeighborhood)

      setLoading(false)

      toast({
        title: "Success",
        description: "Neighborhood created! Now draw its boundary on the map.",
      })

      const params = new URLSearchParams({
        neighborhoodId: newNeighborhood.id,
        name: formData.name,
        description: formData.description || "",
      })

      console.log("[v0] Redirecting to map editor with params:", params.toString())
      router.push(`/t/${slug}/admin/map/locations/create?${params.toString()}`)
    } catch (err: any) {
      console.log("[v0] Error caught:", err)
      setError(err.message || "Failed to create neighborhood")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Neighborhood Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., North Village"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description of the neighborhood"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photos">Photos</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              id="photos"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("photos")?.click()}
              disabled={uploadingPhoto}
              className="w-full"
            >
              {uploadingPhoto ? (
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

          {uploadedPhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {uploadedPhotos.map((url, index) => (
                <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={url || "/placeholder.svg"}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removePhoto(url)}
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {uploadedPhotos.length === 0 && (
            <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg text-muted-foreground">
              <div className="text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No photos uploaded</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Alert>
        <Map className="h-4 w-4" />
        <AlertDescription>
          After creating the neighborhood, you'll be taken to the map editor to draw its boundary.
        </AlertDescription>
      </Alert>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create & Draw Boundary
        </Button>
      </div>
    </form>
  )
}
