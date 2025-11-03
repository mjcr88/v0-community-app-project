"use client"

import { useState, useEffect } from "react"
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createLocation } from "@/app/actions/locations"
import { useRouter } from "next/navigation"
import { Loader2, MapPin, Pentagon, Route, Locate, AlertCircle } from "lucide-react"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"
import { google } from "googlemaps"

type DrawingMode = "marker" | "polygon" | "polyline" | null
type LatLng = { lat: number; lng: number }

interface GoogleMapEditorProps {
  tenantSlug: string
  tenantId: string
}

function MapClickHandler({
  drawingMode,
  onMapClick,
}: {
  drawingMode: DrawingMode
  onMapClick: (lat: number, lng: number) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const clickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        console.log("[v0] Map clicked:", { lat, lng, drawingMode })
        onMapClick(lat, lng)
      }
    })

    return () => {
      google.maps.event.removeListener(clickListener)
    }
  }, [map, drawingMode, onMapClick])

  return null
}

export function GoogleMapEditor({ tenantSlug, tenantId }: GoogleMapEditorProps) {
  const router = useRouter()
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null)
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">("satellite")
  const [saving, setSaving] = useState(false)
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 9.9281, lng: -84.0907 })
  const [mapZoom, setMapZoom] = useState(15)

  const [markerPosition, setMarkerPosition] = useState<LatLng | null>(null)
  const [polygonPoints, setPolygonPoints] = useState<LatLng[]>([])
  const [polylinePoints, setPolylinePoints] = useState<LatLng[]>([])

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [locationType, setLocationType] = useState<"facility" | "lot" | "walking_path">("facility")
  const [facilityType, setFacilityType] = useState("")
  const [icon, setIcon] = useState("")

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  const locateUser = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setMapCenter(newCenter)
          setMapZoom(18)
          console.log("[v0] User located at:", newCenter)
        },
        (error) => {
          console.error("[v0] Geolocation error:", error)
          alert("Could not get your location. Please enable location services.")
        },
      )
    } else {
      alert("Geolocation is not supported by your browser")
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
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

  if (!apiKey) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Configuration Error</AlertTitle>
        <AlertDescription>
          Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
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
              <Button variant="outline" size="sm" onClick={locateUser}>
                <Locate className="mr-2 h-4 w-4" />
                Locate Me
              </Button>
            </div>

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

            <div className="h-[600px] w-full overflow-hidden rounded-lg border">
              <APIProvider apiKey={apiKey}>
                <Map
                  center={mapCenter}
                  zoom={mapZoom}
                  mapTypeId={mapType}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  clickableIcons={false}
                  onCenterChanged={(e) => setMapCenter(e.detail.center)}
                  onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
                >
                  <MapClickHandler drawingMode={drawingMode} onMapClick={handleMapClick} />

                  {markerPosition && (
                    <AdvancedMarker
                      position={markerPosition}
                      onDragEnd={(e) => {
                        if (e.latLng) {
                          setMarkerPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() })
                        }
                      }}
                    />
                  )}

                  {polygonPoints.map((point, index) => (
                    <AdvancedMarker key={`polygon-${index}`} position={point} />
                  ))}

                  {polygonPoints.length > 2 && (
                    <Polygon
                      paths={polygonPoints}
                      strokeColor="#3b82f6"
                      strokeOpacity={0.8}
                      strokeWeight={2}
                      fillColor="#3b82f6"
                      fillOpacity={0.2}
                    />
                  )}

                  {polylinePoints.map((point, index) => (
                    <AdvancedMarker key={`polyline-${index}`} position={point} />
                  ))}

                  {polylinePoints.length > 1 && (
                    <Polyline path={polylinePoints} strokeColor="#f59e0b" strokeOpacity={0.8} strokeWeight={3} />
                  )}
                </Map>
              </APIProvider>
            </div>
          </div>
        </CardContent>
      </Card>

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
