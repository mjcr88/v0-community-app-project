"use client"

import { useState, useEffect, useMemo } from "react"
import Map, { Source, Layer, Marker, NavigationControl } from "react-map-gl"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Locate, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import { geolocate } from "@/lib/geolocate"
import { createLocation, updateTenantBoundary } from "@/lib/location-utils"
import { Switch } from "@/components/ui/switch"
import "mapbox-gl/dist/mapbox-gl.css"

interface GeoJSONPreviewMapProps {
  tenantSlug: string
  tenantId: string
}

export function GeoJSONPreviewMap({ tenantSlug, tenantId }: GeoJSONPreviewMapProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [previewFeatures, setPreviewFeatures] = useState<any[]>([])
  const [originalFeatures, setOriginalFeatures] = useState<any[]>([])
  const [combineFeatures, setCombineFeatures] = useState(false)
  const [viewState, setViewState] = useState({
    latitude: 9.9567,
    longitude: -84.5333,
    zoom: 15
  })
  const [locationType, setLocationType] = useState<
    | "facility"
    | "lot"
    | "walking_path"
    | "neighborhood"
    | "boundary"
    | "protection_zone"
    | "easement"
    | "playground"
    | "public_street"
    | "green_area"
    | "recreational_zone"
  >("facility")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [boundaryExists, setBoundaryExists] = useState(false)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  useEffect(() => {
    const loadData = async () => {
      const previewData = sessionStorage.getItem("geojson-preview")
      if (!previewData) {
        toast({
          title: "No Preview Data",
          description: "Redirecting to map...",
          variant: "destructive",
        })
        router.push(`/t/${tenantSlug}/admin/map`)
        return
      }

      try {
        const parsed = JSON.parse(previewData)
        setOriginalFeatures(parsed.originalFeatures || parsed.features || [])
        setPreviewFeatures(parsed.features || [])

        if (parsed.features && parsed.features.length === 1 && parsed.features[0].geometry.type === "Polygon") {
          setCombineFeatures(true)
        }

        const supabase = createBrowserClient()
        const { data: existingBoundary } = await supabase
          .from("locations")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("type", "boundary")
          .maybeSingle()

        setBoundaryExists(!!existingBoundary)

        if (parsed.features && parsed.features.length > 0) {
          let minLat = Number.POSITIVE_INFINITY
          let maxLat = Number.NEGATIVE_INFINITY
          let minLng = Number.POSITIVE_INFINITY
          let maxLng = Number.NEGATIVE_INFINITY

          parsed.features.forEach((feature: any) => {
            const coords = feature.geometry.coordinates

            if (feature.geometry.type === "Point") {
              const [lng, lat] = coords
              minLat = Math.min(minLat, lat)
              maxLat = Math.max(maxLat, lat)
              minLng = Math.min(minLng, lng)
              maxLng = Math.max(maxLng, lng)
            } else if (feature.geometry.type === "LineString") {
              coords.forEach((coord: number[]) => {
                const [lng, lat] = coord
                minLat = Math.min(minLat, lat)
                maxLat = Math.max(maxLat, lat)
                minLng = Math.min(minLng, lng)
                maxLng = Math.max(maxLng, lng)
              })
            } else if (feature.geometry.type === "Polygon") {
              coords[0].forEach((coord: number[]) => {
                const [lng, lat] = coord
                minLat = Math.min(minLat, lat)
                maxLat = Math.max(maxLat, lat)
                minLng = Math.min(minLng, lng)
                maxLng = Math.max(maxLng, lng)
              })
            } else if (feature.geometry.type === "MultiPolygon") {
              coords[0][0].forEach((coord: number[]) => {
                const [lng, lat] = coord
                minLat = Math.min(minLat, lat)
                maxLat = Math.max(maxLat, lat)
                minLng = Math.min(minLng, lng)
                maxLng = Math.max(maxLng, lng)
              })
            }
          })

          const centerLat = (minLat + maxLat) / 2
          const centerLng = (minLng + maxLng) / 2

          const latDiff = maxLat - minLat
          const lngDiff = maxLng - minLng
          const maxDiff = Math.max(latDiff, lngDiff)

          let zoom = 15
          if (maxDiff > 0.1) zoom = 12
          if (maxDiff > 0.5) zoom = 10
          if (maxDiff > 1) zoom = 9
          if (maxDiff > 5) zoom = 7

          setViewState({
            latitude: centerLat,
            longitude: centerLng,
            zoom
          })
        }

        setLoading(false)
      } catch (error) {
        console.error("Error loading preview data:", error)
        toast({
          title: "Error",
          description: "Failed to load preview data",
          variant: "destructive",
        })
        router.push(`/t/${tenantSlug}/admin/map`)
      }
    }

    loadData()
  }, [tenantSlug, tenantId, router, toast])

  const locateUser = async () => {
    try {
      const { lat, lng } = await geolocate()
      setViewState(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        zoom: 15
      }))
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not get your location",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    if (!locationType) {
      toast({
        title: "Validation Error",
        description: "Please select a location type",
        variant: "destructive",
      })
      return
    }

    if (locationType === "boundary" && boundaryExists) {
      toast({
        title: "Validation Error",
        description: "A boundary already exists. Please delete the existing boundary first.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const supabase = createBrowserClient()

      if (locationType === "boundary") {
        const feature = previewFeatures[0]

        if (previewFeatures.length > 1) {
          toast({
            title: "Validation Error",
            description: "Only one boundary can be imported at a time.",
            variant: "destructive",
          })
          setSaving(false)
          return
        }

        console.log("[v0] Processing boundary with geometry type:", feature.geometry.type)

        let boundaryCoordinatesArray: number[][]

        if (feature.geometry.type === "Polygon") {
          boundaryCoordinatesArray = feature.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]])
        } else if (feature.geometry.type === "MultiPolygon") {
          boundaryCoordinatesArray = feature.geometry.coordinates[0][0].map((coord: number[]) => [coord[1], coord[0]])
        } else {
          toast({
            title: "Validation Error",
            description: "Boundary must be a Polygon or MultiPolygon.",
            variant: "destructive",
          })
          setSaving(false)
          return
        }

        console.log("[v0] Saving boundary with", boundaryCoordinatesArray.length, "coordinates")

        const locationResult = await createLocation({
          tenant_id: tenantId,
          name: feature.properties?.name || "Community Boundary",
          type: "boundary",
          description: feature.properties?.description || null,
          boundary_coordinates: boundaryCoordinatesArray,
        })

        if (!locationResult.success) {
          toast({
            title: "Error",
            description: locationResult.error || "Failed to create boundary location",
            variant: "destructive",
          })
          setSaving(false)
          return
        }

        console.log("[v0] Boundary location created, updating tenant...")

        const tenantResult = await updateTenantBoundary(tenantId, boundaryCoordinatesArray)

        if (!tenantResult.success) {
          toast({
            title: "Error",
            description: tenantResult.error || "Failed to update tenant boundary",
            variant: "destructive",
          })
          setSaving(false)
          return
        }

        console.log("[v0] Tenant boundary updated successfully")

        toast({
          title: "Success",
          description: "Boundary imported successfully",
        })

        sessionStorage.removeItem("geojson-preview")
        router.push(`/t/${tenantSlug}/admin/map`)
        return
      } else {
        const featuresToSave = combineFeatures ? previewFeatures : originalFeatures

        let successCount = 0
        let errorCount = 0

        console.log("[v0] Saving", featuresToSave.length, "features (combine mode:", combineFeatures, ")")

        for (const feature of featuresToSave) {
          try {
            const locationData: any = {
              tenant_id: tenantId,
              name: feature.properties?.name || `Imported ${feature.geometry.type} ${successCount + 1}`,
              type: locationType,
              description: feature.properties?.description || null,
            }

            if (feature.geometry.type === "Point") {
              locationData.coordinates = {
                lat: feature.geometry.coordinates[1],
                lng: feature.geometry.coordinates[0],
              }
            } else if (feature.geometry.type === "LineString") {
              locationData.path_coordinates = feature.geometry.coordinates.map((coord: number[]) => [
                coord[1],
                coord[0],
              ])

              // Include calculated stats and path properties
              if (feature.properties?.path_length !== undefined) locationData.path_length = feature.properties.path_length
              if (feature.properties?.elevation_gain !== undefined) locationData.elevation_gain = feature.properties.elevation_gain
              if (feature.properties?.path_difficulty) locationData.path_difficulty = feature.properties.path_difficulty
              if (feature.properties?.path_surface) locationData.path_surface = feature.properties.path_surface
              if (feature.properties?.color) locationData.color = feature.properties.color
            } else if (feature.geometry.type === "Polygon") {
              locationData.boundary_coordinates = feature.geometry.coordinates[0].map((coord: number[]) => [
                coord[1],
                coord[0],
              ])
            }

            console.log("[v0] Saving location:", {
              name: locationData.name,
              type: locationData.type,
              geometryType: feature.geometry.type,
              hasCoordinates: !!locationData.coordinates,
              hasBoundaryCoordinates: !!locationData.boundary_coordinates,
              hasPathCoordinates: !!locationData.path_coordinates,
            })

            const { error } = await supabase.from("locations").insert(locationData)
            if (error) {
              console.error("[v0] Error creating location:", error)
              errorCount++
            } else {
              successCount++
            }
          } catch (err) {
            console.error("[v0] Error processing feature:", err)
            errorCount++
          }
        }

        if (successCount > 0) {
          toast({
            title: "Success",
            description: `${successCount} location(s) created successfully!${errorCount > 0 ? ` (${errorCount} failed)` : ""}`,
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to create any locations",
            variant: "destructive",
          })
        }
      }

      sessionStorage.removeItem("geojson-preview")
      router.push(`/t/${tenantSlug}/admin/map`)
    } catch (error) {
      console.error("Error saving locations:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save locations",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    sessionStorage.removeItem("geojson-preview")
    router.push(`/t/${tenantSlug}/admin/map`)
  }

  const locationCount = combineFeatures ? previewFeatures.length : originalFeatures.length

  // Prepare GeoJSON data for Mapbox
  const geojsonData = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: previewFeatures
    }
  }, [previewFeatures])

  if (!mapboxToken) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Configuration Error</AlertTitle>
        <AlertDescription>Mapbox token is missing.</AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <Card className="min-h-[600px]">
        <CardContent className="p-1.5 h-full">
          <div className="relative h-full w-full overflow-hidden rounded-lg">
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              style={{ width: "100%", height: "600px" }}
              mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
              mapboxAccessToken={mapboxToken}
            >
              <NavigationControl position="bottom-right" />

              {/* Render GeoJSON Features */}
              <Source id="preview-data" type="geojson" data={geojsonData}>
                {/* Polygons Fill */}
                <Layer
                  id="preview-fill"
                  type="fill"
                  filter={["==", "$type", "Polygon"]}
                  paint={{
                    "fill-color": locationType === "boundary" ? "#ffffff" : "#a855f7",
                    "fill-opacity": locationType === "boundary" ? 0.15 : 0.2
                  }}
                />

                {/* Polygons/Lines Stroke */}
                <Layer
                  id="preview-line"
                  type="line"
                  filter={["any", ["==", "$type", "Polygon"], ["==", "$type", "LineString"]]}
                  paint={{
                    "line-color": locationType === "boundary" ? "#ffffff" : "#a855f7",
                    "line-width": locationType === "boundary" ? 2 : 3,
                    "line-opacity": 0.9
                  }}
                />

                {/* Points */}
                <Layer
                  id="preview-point"
                  type="circle"
                  filter={["==", "$type", "Point"]}
                  paint={{
                    "circle-radius": 6,
                    "circle-color": "#a855f7",
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#ffffff"
                  }}
                />
              </Source>
            </Map>

            <div className="absolute bottom-32 right-3">
              <Button variant="secondary" size="icon" onClick={locateUser} className="h-10 w-10 shadow-lg">
                <Locate className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Import GeoJSON</h3>
            <p className="text-sm text-muted-foreground">
              {locationCount} location{locationCount !== 1 ? "s" : ""} will be created
            </p>
          </div>

          {locationType !== "boundary" && originalFeatures.length > 1 && (
            <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="combine-mode" className="text-sm font-medium">
                  Combine into one location
                </Label>
                <p className="text-xs text-muted-foreground">
                  {combineFeatures
                    ? `Creating 1 combined location`
                    : `Creating ${originalFeatures.length} separate locations`}
                </p>
              </div>
              <Switch id="combine-mode" checked={combineFeatures} onCheckedChange={setCombineFeatures} />
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              All features will be imported as the same location type. You can edit them individually after import.
            </AlertDescription>
          </Alert>

          {boundaryExists && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Boundary Exists</AlertTitle>
              <AlertDescription>
                A community boundary already exists. Delete the existing boundary from the map editor before importing a
                new one.
              </AlertDescription>
            </Alert>
          )}

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
                <SelectItem value="boundary" disabled={boundaryExists}>
                  Boundary {boundaryExists && "(Already exists)"}
                </SelectItem>
                <SelectItem value="protection_zone">Protection Zone</SelectItem>
                <SelectItem value="easement">Easement</SelectItem>
                <SelectItem value="playground">Playground</SelectItem>
                <SelectItem value="public_street">Public Street</SelectItem>
                <SelectItem value="green_area">Green Area</SelectItem>
                <SelectItem value="recreational_zone">Recreational Zone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 space-y-2">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create {locationCount} Location{locationCount !== 1 ? "s" : ""}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={saving} className="w-full bg-transparent">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
