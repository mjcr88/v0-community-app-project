"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { ParsedGeoJSON } from "@/lib/geojson-parser"
import { GoogleMapEditor } from "./google-map-editor"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createLocation } from "@/app/actions/locations"

interface GoogleMapEditorClientWrapperProps {
  tenantSlug: string
  tenantId: string
  communityBoundary: any
  lots: any[]
  neighborhoods: any[]
  isPreview: boolean
}

export function GoogleMapEditorClientWrapper({
  tenantSlug,
  tenantId,
  communityBoundary,
  lots,
  neighborhoods,
  isPreview,
}: GoogleMapEditorClientWrapperProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [previewData, setPreviewData] = useState<ParsedGeoJSON | null>(null)
  const [locationType, setLocationType] = useState<"facility" | "lot" | "walking_path" | "neighborhood" | "boundary">(
    "facility",
  )
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isPreview) {
      const storedData = sessionStorage.getItem("geojson-preview")
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData)
          setPreviewData(parsed)
          console.log("[v0] Preview data loaded from sessionStorage:", parsed.summary)
          // Clear after reading
          sessionStorage.removeItem("geojson-preview")
        } catch (error) {
          console.error("[v0] Failed to parse preview data:", error)
        }
      }
    }
  }, [isPreview])

  const handleCreateLocations = async () => {
    if (!previewData) return

    setCreating(true)

    try {
      let successCount = 0
      let errorCount = 0

      for (const feature of previewData.features) {
        try {
          const locationData: any = {
            tenant_id: tenantId,
            name: feature.properties.name || `Imported ${feature.geometry.type}`,
            type: locationType,
            description: feature.properties.description || null,
          }

          // Map geometry to location fields based on type
          if (feature.geometry.type === "Point") {
            const [lng, lat] = feature.geometry.coordinates
            locationData.coordinates = { lat, lng }
          } else if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
            // For polygons, use the first ring of coordinates
            const coords =
              feature.geometry.type === "Polygon" ? feature.geometry.coordinates[0] : feature.geometry.coordinates[0][0]
            locationData.boundary_coordinates = coords.map(([lng, lat]: [number, number]) => [lat, lng])
          } else if (feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString") {
            const coords =
              feature.geometry.type === "LineString" ? feature.geometry.coordinates : feature.geometry.coordinates[0]
            locationData.path_coordinates = coords.map(([lng, lat]: [number, number]) => [lat, lng])
          }

          await createLocation(locationData)
          successCount++
        } catch (error) {
          console.error("[v0] Error creating location:", error)
          errorCount++
        }
      }

      toast({
        title: "Import Complete",
        description: `Successfully created ${successCount} location${successCount === 1 ? "" : "s"}${errorCount > 0 ? `. ${errorCount} failed.` : ""}`,
      })

      // Redirect back to map page
      router.push(`/t/${tenantSlug}/admin/map`)
    } catch (error) {
      console.error("[v0] Error creating locations:", error)
      toast({
        title: "Error",
        description: "Failed to create locations: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleCancel = () => {
    router.push(`/t/${tenantSlug}/admin/map`)
  }

  if (!isPreview || !previewData) {
    return (
      <GoogleMapEditor
        tenantSlug={tenantSlug}
        tenantId={tenantId}
        lots={lots}
        neighborhoods={neighborhoods}
        mode="edit"
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <GoogleMapEditor
        tenantSlug={tenantSlug}
        tenantId={tenantId}
        lots={lots}
        neighborhoods={neighborhoods}
        mode="edit"
        previewFeatures={previewData.features}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Preview Mode</AlertTitle>
            <AlertDescription>
              Review the imported features on the map. Select a location type and click "Create Locations" to save them.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Import Summary</Label>
            <div className="text-sm space-y-1">
              <p>
                <strong>Total Features:</strong> {previewData.summary.totalFeatures}
              </p>
              {Object.entries(previewData.summary.byType).map(([type, count]) => (
                <p key={type}>
                  <strong>{type}:</strong> {count}
                </p>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location-type">Location Type *</Label>
            <Select value={locationType} onValueChange={(v) => setLocationType(v as any)}>
              <SelectTrigger id="location-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facility">Facility</SelectItem>
                <SelectItem value="lot">Lot</SelectItem>
                <SelectItem value="neighborhood">Neighborhood</SelectItem>
                <SelectItem value="walking_path">Walking Path</SelectItem>
                <SelectItem value="boundary">Boundary</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">All imported features will be created as this type</p>
          </div>

          <div className="pt-4 space-y-2">
            <Button onClick={handleCreateLocations} disabled={creating} className="w-full">
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create {previewData.summary.totalFeatures} Location{previewData.summary.totalFeatures === 1 ? "" : "s"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={creating} className="w-full bg-transparent">
              Cancel Import
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
