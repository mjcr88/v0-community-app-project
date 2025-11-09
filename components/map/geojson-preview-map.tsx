"use client"

import { useState, useEffect } from "react"
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Locate, AlertCircle } from "lucide-react"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import { geolocate } from "@/lib/geolocate"
import { createLocation, updateTenantBoundary } from "@/lib/location-utils"
import { Switch } from "@/components/ui/switch"

type LatLng = { lat: number; lng: number }

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
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 9.9567, lng: -84.5333 })
  const [mapZoom, setMapZoom] = useState(15)
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

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const DEMO_MAP_ID = "DEMO_MAP_ID"
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || DEMO_MAP_ID

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
          setMapCenter({ lat: centerLat, lng: centerLng })

          const latDiff = maxLat - minLat
          const lngDiff = maxLng - minLng
          const maxDiff = Math.max(latDiff, lngDiff)

          let zoom = 15
          if (maxDiff > 0.1) zoom = 12
          if (maxDiff > 0.5) zoom = 10
          if (maxDiff > 1) zoom = 9
          if (maxDiff > 5) zoom = 7

          setMapZoom(zoom)
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
      setMapCenter({ lat, lng })
      setMapZoom(15)
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

  if (!apiKey) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Configuration Error</AlertTitle>
        <AlertDescription>Google Maps API key is missing.</AlertDescription>
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
            <APIProvider apiKey={apiKey}>
              <Map
                center={mapCenter}
                zoom={mapZoom}
                mapTypeId="satellite"
                gestureHandling="greedy"
                disableDefaultUI={true}
                clickableIcons={false}
                onCenterChanged={(e) => setMapCenter(e.detail.center)}
                onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
                {...(mapId ? { mapId } : {})}
              >
                {previewFeatures.map((feature, index) => {
                  if (feature.geometry.type === "Point") {
                    return (
                      <Marker
                        key={`preview-${index}`}
                        position={{
                          lat: feature.geometry.coordinates[1],
                          lng: feature.geometry.coordinates[0],
                        }}
                      />
                    )
                  } else if (feature.geometry.type === "LineString") {
                    const path = feature.geometry.coordinates.map((coord: number[]) => ({
                      lat: coord[1],
                      lng: coord[0],
                    }))
                    return (
                      <Polyline
                        key={`preview-${index}`}
                        path={path}
                        strokeColor="#a855f7"
                        strokeOpacity={0.9}
                        strokeWeight={1.5}
                        clickable={false}
                      />
                    )
                  } else if (feature.geometry.type === "Polygon") {
                    const paths = feature.geometry.coordinates[0].map((coord: number[]) => ({
                      lat: coord[1],
                      lng: coord[0],
                    }))

                    const isBoundary = locationType === "boundary"

                    return (
                      <Polygon
                        key={`preview-${index}`}
                        paths={paths}
                        strokeColor={isBoundary ? "#ffffff" : "#a855f7"}
                        strokeOpacity={isBoundary ? 0.8 : 0.9}
                        strokeWeight={isBoundary ? 2 : 1}
                        fillColor={isBoundary ? "#ffffff" : "#a855f7"}
                        fillOpacity={isBoundary ? 0.15 : 0.2}
                        clickable={false}
                      />
                    )
                  } else if (feature.geometry.type === "MultiPolygon") {
                    const paths = feature.geometry.coordinates[0][0].map((coord: number[]) => ({
                      lat: coord[1],
                      lng: coord[0],
                    }))

                    const isBoundary = locationType === "boundary"

                    return (
                      <Polygon
                        key={`preview-${index}`}
                        paths={paths}
                        strokeColor={isBoundary ? "#ffffff" : "#a855f7"}
                        strokeOpacity={isBoundary ? 0.8 : 0.9}
                        strokeWeight={isBoundary ? 2 : 1}
                        fillColor={isBoundary ? "#ffffff" : "#a855f7"}
                        fillOpacity={isBoundary ? 0.15 : 0.2}
                        clickable={false}
                      />
                    )
                  }
                  return null
                })}
              </Map>
            </APIProvider>

            <div className="absolute left-3 top-3 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setMapZoom(mapZoom + 1)}
                className="h-10 w-10 shadow-lg"
              >
                +
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setMapZoom(mapZoom - 1)}
                className="h-10 w-10 shadow-lg"
              >
                −
              </Button>
            </div>

            <div className="absolute bottom-3 right-3">
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
