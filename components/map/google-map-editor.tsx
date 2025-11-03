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
import { Loader2, MapPin, Pentagon, Route, Locate, AlertCircle, Trash2, Undo, Layers } from "lucide-react"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"

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

    const clickListener = map.addListener("click", (e: any) => {
      if (e.latLng) {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        console.log("[v0] Map clicked:", { lat, lng, drawingMode })
        onMapClick(lat, lng)
      }
    })

    return () => {
      if (clickListener) {
        clickListener.remove()
      }
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
              `Click to add points (${polygonPoints.length} points). Click to finish or undo.`}
            {drawingMode === "polyline" &&
              `Click to add points (${polylinePoints.length} points). Click to finish or undo.`}
            {!drawingMode && "Select a drawing tool to start"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-[600px] w-full overflow-hidden rounded-lg border">
            <APIProvider apiKey={apiKey}>
              <Map
                center={mapCenter}
                zoom={mapZoom}
                mapTypeId={mapType}
                gestureHandling="greedy"
                disableDefaultUI={true}
                clickableIcons={false}
                onCenterChanged={(e) => setMapCenter(e.detail.center)}
                onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
              >
                <MapClickHandler drawingMode={drawingMode} onMapClick={handleMapClick} />

                {markerPosition && (
                  <AdvancedMarker
                    position={markerPosition}
                    draggable
                    onDragEnd={(e) => {
                      const latLng = e.latLng
                      if (latLng) {
                        setMarkerPosition({ lat: latLng.lat(), lng: latLng.lng() })
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

            <div className="absolute left-3 top-3 flex flex-col gap-2">
              <Button
                variant={drawingMode === "marker" ? "default" : "secondary"}
                size="icon"
                onClick={() => setDrawingMode(drawingMode === "marker" ? null : "marker")}
                className="h-10 w-10 shadow-lg"
                title="Place Marker"
              >
                <MapPin className="h-5 w-5" />
              </Button>
              <Button
                variant={drawingMode === "polygon" ? "default" : "secondary"}
                size="icon"
                onClick={() => setDrawingMode(drawingMode === "polygon" ? null : "polygon")}
                className="h-10 w-10 shadow-lg"
                title="Draw Polygon"
              >
                <Pentagon className="h-5 w-5" />
              </Button>
              <Button
                variant={drawingMode === "polyline" ? "default" : "secondary"}
                size="icon"
                onClick={() => setDrawingMode(drawingMode === "polyline" ? null : "polyline")}
                className="h-10 w-10 shadow-lg"
                title="Draw Path"
              >
                <Route className="h-5 w-5" />
              </Button>
              <div className="h-px bg-border" />
              <Button
                variant="secondary"
                size="icon"
                onClick={undoLastPoint}
                disabled={
                  (drawingMode === "polygon" && polygonPoints.length === 0) ||
                  (drawingMode === "polyline" && polylinePoints.length === 0) ||
                  !drawingMode
                }
                className="h-10 w-10 shadow-lg"
                title="Undo Last Point"
              >
                <Undo className="h-5 w-5" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={clearDrawing}
                className="h-10 w-10 shadow-lg"
                title="Clear All"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>

            <div className="absolute right-3 top-3 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setMapZoom(mapZoom + 1)}
                className="h-10 w-10 shadow-lg"
                title="Zoom In"
              >
                +
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setMapZoom(mapZoom - 1)}
                className="h-10 w-10 shadow-lg"
                title="Zoom Out"
              >
                −
              </Button>
            </div>

            <div className="absolute bottom-3 left-3 flex gap-2">
              <Select value={mapType} onValueChange={(v) => setMapType(v as any)}>
                <SelectTrigger className="w-32 shadow-lg">
                  <Layers className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="satellite">Satellite</SelectItem>
                  <SelectItem value="terrain">Terrain</SelectItem>
                  <SelectItem value="roadmap">Street</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" size="icon" onClick={locateUser} className="shadow-lg" title="Locate Me">
                <Locate className="h-4 w-4" />
              </Button>
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
