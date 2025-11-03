"use client"

import { useState } from "react"
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createLocation } from "@/app/actions/locations"
import { useRouter } from "next/navigation"
import { Loader2, MapPin, Pentagon, Route } from "lucide-react"
import type { google } from "google-maps"

type DrawingMode = "marker" | "polygon" | "polyline" | null
type LatLng = { lat: number; lng: number }

interface GoogleMapEditorProps {
  tenantSlug: string
  tenantId: string
}

export function GoogleMapEditor({ tenantSlug, tenantId }: GoogleMapEditorProps) {
  const router = useRouter()
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null)
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">("satellite")
  const [saving, setSaving] = useState(false)

  // Drawing state
  const [markerPosition, setMarkerPosition] = useState<LatLng | null>(null)
  const [polygonPoints, setPolygonPoints] = useState<LatLng[]>([])
  const [polylinePoints, setPolylinePoints] = useState<LatLng[]>([])

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [locationType, setLocationType] = useState<"facility" | "lot" | "walking_path">("facility")
  const [facilityType, setFacilityType] = useState("")
  const [icon, setIcon] = useState("")

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return

    const lat = e.latLng.lat()
    const lng = e.latLng.lng()

    console.log("[v0] Map clicked:", { lat, lng, drawingMode })

    if (drawingMode === "marker") {
      setMarkerPosition({ lat, lng })
      setDrawingMode(null)
    } else if (drawingMode === "polygon") {
      setPolygonPoints([...polygonPoints, { lat, lng }])
    } else if (drawingMode === "polyline") {
      setPolylinePoints([...polylinePoints, { lat, lng }])
    }
  }

  const finishDrawing = () => {
    setDrawingMode(null)
  }

  const clearDrawing = () => {
    setMarkerPosition(null)
    setPolygonPoints([])
    setPolylinePoints([])
    setDrawingMode(null)
  }

  const undoLastPoint = () => {
    if (drawingMode === "polygon" && polygonPoints.length > 0) {
      setPolygonPoints(polygonPoints.slice(0, -1))
    } else if (drawingMode === "polyline" && polylinePoints.length > 0) {
      setPolylinePoints(polylinePoints.slice(0, -1))
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a location name")
      return
    }

    // Validate that we have the right data for the location type
    if (locationType === "facility" && !markerPosition && polygonPoints.length === 0) {
      alert("Please place a marker or draw a boundary for the facility")
      return
    }
    if (locationType === "lot" && polygonPoints.length < 3) {
      alert("Please draw a boundary for the lot (at least 3 points)")
      return
    }
    if (locationType === "walking_path" && polylinePoints.length < 2) {
      alert("Please draw a path (at least 2 points)")
      return
    }

    setSaving(true)

    try {
      const locationData: any = {
        tenant_id: tenantId,
        name: name.trim(),
        type: locationType,
        description: description.trim() || null,
      }

      // Add coordinates based on location type
      if (locationType === "facility") {
        if (markerPosition) {
          locationData.coordinates = markerPosition
        }
        if (polygonPoints.length > 0) {
          locationData.boundary_coordinates = polygonPoints.map((p) => [p.lat, p.lng])
        }
        if (facilityType) locationData.facility_type = facilityType
        if (icon) locationData.icon = icon
      } else if (locationType === "lot") {
        locationData.boundary_coordinates = polygonPoints.map((p) => [p.lat, p.lng])
      } else if (locationType === "walking_path") {
        locationData.path_coordinates = polylinePoints.map((p) => [p.lat, p.lng])
      }

      console.log("[v0] Saving location:", locationData)

      await createLocation(locationData)

      alert("Location saved successfully!")
      router.push(`/t/${tenantSlug}/admin/map`)
    } catch (error) {
      console.error("[v0] Error saving location:", error)
      alert("Error saving location: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Map</CardTitle>
          <CardDescription>
            {drawingMode === "marker" && "Click on the map to place a marker"}
            {drawingMode === "polygon" &&
              `Click to add points (${polygonPoints.length} points). Click Finish when done.`}
            {drawingMode === "polyline" &&
              `Click to add points (${polylinePoints.length} points). Click Finish when done.`}
            {!drawingMode && "Select a drawing tool to start"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Drawing Controls */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={drawingMode === "marker" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("marker")}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Marker
              </Button>
              <Button
                variant={drawingMode === "polygon" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("polygon")}
              >
                <Pentagon className="mr-2 h-4 w-4" />
                Polygon
              </Button>
              <Button
                variant={drawingMode === "polyline" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("polyline")}
              >
                <Route className="mr-2 h-4 w-4" />
                Path
              </Button>
              {(drawingMode === "polygon" || drawingMode === "polyline") && (
                <>
                  <Button variant="secondary" size="sm" onClick={undoLastPoint}>
                    Undo
                  </Button>
                  <Button variant="secondary" size="sm" onClick={finishDrawing}>
                    Finish
                  </Button>
                </>
              )}
              <Button variant="destructive" size="sm" onClick={clearDrawing}>
                Clear
              </Button>
            </div>

            {/* Map Type Controls */}
            <div className="flex gap-2">
              <Button
                variant={mapType === "satellite" ? "default" : "outline"}
                size="sm"
                onClick={() => setMapType("satellite")}
              >
                Satellite
              </Button>
              <Button
                variant={mapType === "terrain" ? "default" : "outline"}
                size="sm"
                onClick={() => setMapType("terrain")}
              >
                Terrain
              </Button>
              <Button
                variant={mapType === "roadmap" ? "default" : "outline"}
                size="sm"
                onClick={() => setMapType("roadmap")}
              >
                Street
              </Button>
            </div>

            {/* Map Container */}
            <div className="h-[600px] w-full overflow-hidden rounded-lg border">
              <APIProvider apiKey={apiKey}>
                <Map
                  defaultCenter={{ lat: 9.9281, lng: -84.0907 }}
                  defaultZoom={15}
                  mapTypeId={mapType}
                  onClick={handleMapClick}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  clickableIcons={false}
                >
                  {/* Render marker */}
                  {markerPosition && <AdvancedMarker position={markerPosition} />}

                  {/* Render polygon points as markers */}
                  {polygonPoints.map((point, index) => (
                    <AdvancedMarker key={`polygon-${index}`} position={point} />
                  ))}

                  {/* Render polyline points as markers */}
                  {polylinePoints.map((point, index) => (
                    <AdvancedMarker key={`polyline-${index}`} position={point} />
                  ))}
                </Map>
              </APIProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
          <CardDescription>Enter information about this location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Location Type</Label>
            <Select value={locationType} onValueChange={(v) => setLocationType(v as any)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facility">Facility</SelectItem>
                <SelectItem value="lot">Lot</SelectItem>
                <SelectItem value="walking_path">Walking Path</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Community Pool"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          {locationType === "facility" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="facilityType">Facility Type</Label>
                <Input
                  id="facilityType"
                  value={facilityType}
                  onChange={(e) => setFacilityType(e.target.value)}
                  placeholder="e.g., Pool, Gym, Park"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="e.g., 🏊 or pool"
                />
              </div>
            </>
          )}

          <div className="pt-4 space-y-2">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Location
            </Button>
            <Button variant="outline" onClick={() => router.push(`/t/${tenantSlug}/admin/map`)} className="w-full">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
