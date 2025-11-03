"use client"

import { useState, useEffect } from "react"
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createLocation } from "@/app/actions/locations"
import { useRouter } from "next/navigation"
import {
  Loader2,
  MapPin,
  Pentagon,
  Route,
  Locate,
  AlertCircle,
  Trash2,
  Undo,
  Layers,
  Check,
  Filter,
} from "lucide-react"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import { geolocate } from "@/lib/geolocate"

type DrawingMode = "marker" | "polygon" | "polyline" | null
type LatLng = { lat: number; lng: number }

interface GoogleMapEditorProps {
  tenantSlug: string
  tenantId: string
  communityBoundary?: Array<[number, number]> | null
  lots?: Array<{ id: string; lot_number: string; address: string | null; neighborhoods: { name: string } | null }>
  neighborhoods?: Array<{ id: string; name: string }>
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

export function GoogleMapEditor({
  tenantSlug,
  tenantId,
  communityBoundary,
  lots = [],
  neighborhoods = [],
}: GoogleMapEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null)
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">("satellite")
  const [saving, setSaving] = useState(false)
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 9.9567, lng: -84.5333 })
  const [mapZoom, setMapZoom] = useState(15)

  const [markerPosition, setMarkerPosition] = useState<LatLng | null>(null)
  const [polygonPoints, setPolygonPoints] = useState<LatLng[]>([])
  const [polylinePoints, setPolylinePoints] = useState<LatLng[]>([])
  const [savedLocations, setSavedLocations] = useState<any[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [locationType, setLocationType] = useState<"facility" | "lot" | "walking_path">("facility")
  const [facilityType, setFacilityType] = useState("")
  const [icon, setIcon] = useState("")
  const [selectedLotId, setSelectedLotId] = useState<string>("")
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>("")

  const [showFacilities, setShowFacilities] = useState(true)
  const [showLots, setShowLots] = useState(true)
  const [showWalkingPaths, setShowWalkingPaths] = useState(true)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  useEffect(() => {
    const fetchLocations = async () => {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("locations").select("*").eq("tenant_id", tenantId)

      if (!error && data) {
        setSavedLocations(data)
      }
    }

    fetchLocations()
  }, [tenantId])

  const handleMapClick = (lat: number, lng: number) => {
    if (drawingMode === "marker") {
      setMarkerPosition({ lat, lng })
      setDrawingMode(null)
    } else if (drawingMode === "polygon") {
      const newPoints = [...polygonPoints, { lat, lng }]
      console.log("[v0] Polygon points updated:", newPoints.length, newPoints)
      setPolygonPoints(newPoints)
    } else if (drawingMode === "polyline") {
      const newPoints = [...polylinePoints, { lat, lng }]
      console.log("[v0] Polyline points updated:", newPoints.length, newPoints)
      setPolylinePoints(newPoints)
    }
  }

  const finishDrawing = () => {
    if (drawingMode === "polygon" && polygonPoints.length < 3) {
      toast({
        title: "Validation Error",
        description: "A polygon needs at least 3 points",
        variant: "destructive",
      })
      return
    }
    if (drawingMode === "polyline" && polylinePoints.length < 2) {
      toast({
        title: "Validation Error",
        description: "A line needs at least 2 points",
        variant: "destructive",
      })
      return
    }
    setDrawingMode(null)
  }

  const clearDrawing = () => {
    setMarkerPosition(null)
    setPolygonPoints([])
    setPolylinePoints([])
    setDrawingMode(null)
    toast({
      description: "All drawings cleared",
    })
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
      toast({
        title: "Validation Error",
        description: "Please enter a location name",
        variant: "destructive",
      })
      return
    }

    if (locationType === "facility" && !markerPosition && polygonPoints.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please place a marker or draw a boundary for the facility",
        variant: "destructive",
      })
      return
    }
    if (locationType === "lot" && polygonPoints.length < 3) {
      toast({
        title: "Validation Error",
        description: "Please draw a boundary for the lot (at least 3 points)",
        variant: "destructive",
      })
      return
    }
    if (locationType === "lot" && !selectedLotId) {
      toast({
        title: "Validation Error",
        description: "Please select a lot from the dropdown",
        variant: "destructive",
      })
      return
    }
    if (locationType === "walking_path" && polylinePoints.length < 2) {
      toast({
        title: "Validation Error",
        description: "Please draw a path (at least 2 points)",
        variant: "destructive",
      })
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
        if (selectedNeighborhoodId) locationData.neighborhood_id = selectedNeighborhoodId
      } else if (locationType === "lot") {
        locationData.boundary_coordinates = polygonPoints.map((p) => [p.lat, p.lng])
        locationData.lot_id = selectedLotId
      } else if (locationType === "walking_path") {
        locationData.path_coordinates = polylinePoints.map((p) => [p.lat, p.lng])
        if (selectedNeighborhoodId) locationData.neighborhood_id = selectedNeighborhoodId
      }

      console.log("[v0] Saving location:", locationData)

      await createLocation(locationData)

      toast({
        title: "Success",
        description: "Location saved successfully!",
      })

      const supabase = createBrowserClient()
      const { data } = await supabase.from("locations").select("*").eq("tenant_id", tenantId)

      if (data) {
        setSavedLocations(data)
      }

      router.push(`/t/${tenantSlug}/admin/map`)
    } catch (error) {
      console.error("[v0] Error saving location:", error)
      toast({
        title: "Error",
        description: "Error saving location: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const locateUser = async () => {
    try {
      const { lat, lng } = await geolocate()
      setMapCenter({ lat, lng })
      setMapZoom(15)
    } catch (error) {
      console.error("Error locating user:", error)
      toast({
        title: "Error",
        description: "Error locating user: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      })
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

  const filteredLocations = savedLocations.filter((location) => {
    if (location.type === "facility") return showFacilities
    if (location.type === "lot") return showLots
    if (location.type === "walking_path") return showWalkingPaths
    return true
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <Card className="min-h-[600px]">
        <CardContent className="p-1.5 h-full">
          <div className="relative h-full w-full overflow-hidden rounded-lg">
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

                {communityBoundary && communityBoundary.length >= 3 && (
                  <Polygon
                    paths={communityBoundary.map((coord) => ({ lat: coord[0], lng: coord[1] }))}
                    strokeColor="#10b981"
                    strokeOpacity={0.6}
                    strokeWeight={2}
                    fillColor="#10b981"
                    fillOpacity={0.08}
                    clickable={false}
                  />
                )}

                {filteredLocations.map((location) => {
                  if (location.type === "facility" && location.coordinates) {
                    return <Marker key={`saved-${location.id}`} position={location.coordinates} />
                  }
                  if (location.type === "facility" && location.boundary_coordinates) {
                    const paths = location.boundary_coordinates.map((coord: [number, number]) => ({
                      lat: coord[0],
                      lng: coord[1],
                    }))
                    return (
                      <Polygon
                        key={`saved-${location.id}`}
                        paths={paths}
                        strokeColor="#86efac"
                        strokeOpacity={0.6}
                        strokeWeight={1.5}
                        fillColor="#86efac"
                        fillOpacity={0.15}
                        clickable={false}
                      />
                    )
                  }
                  if (location.type === "lot" && location.boundary_coordinates) {
                    const paths = location.boundary_coordinates.map((coord: [number, number]) => ({
                      lat: coord[0],
                      lng: coord[1],
                    }))
                    return (
                      <Polygon
                        key={`saved-${location.id}`}
                        paths={paths}
                        strokeColor="#93c5fd"
                        strokeOpacity={0.6}
                        strokeWeight={1.5}
                        fillColor="#93c5fd"
                        fillOpacity={0.15}
                        clickable={false}
                      />
                    )
                  }
                  if (location.type === "walking_path" && location.path_coordinates) {
                    const path = location.path_coordinates.map((coord: [number, number]) => ({
                      lat: coord[0],
                      lng: coord[1],
                    }))
                    return (
                      <Polyline
                        key={`saved-${location.id}`}
                        path={path}
                        strokeColor="#fcd34d"
                        strokeOpacity={0.7}
                        strokeWeight={2.5}
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

            <div className="absolute left-3 bottom-3 flex flex-col gap-2">
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
              {(drawingMode === "polygon" || drawingMode === "polyline") && (
                <Button
                  variant="default"
                  size="icon"
                  onClick={finishDrawing}
                  className="h-10 w-10 shadow-lg bg-green-600 hover:bg-green-700"
                  title="Finish Drawing"
                >
                  <Check className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="secondary"
                size="icon"
                onClick={undoLastPoint}
                disabled={
                  (drawingMode === "polygon" && polygonPoints.length === 0) ||
                  (drawingMode === "polyline" && polylinePoints.length === 0) ||
                  (!drawingMode && polygonPoints.length === 0 && polylinePoints.length === 0)
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

            <div className="absolute right-3 top-3 flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-10 w-10 shadow-lg" title="Filter Locations">
                    <Filter className="h-4 w-4 text-black" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Show on Map</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={showFacilities} onCheckedChange={setShowFacilities}>
                    Facilities
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showLots} onCheckedChange={setShowLots}>
                    Lots
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showWalkingPaths} onCheckedChange={setShowWalkingPaths}>
                    Walking Paths
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-10 w-10 shadow-lg" title="Map Type">
                    <Layers className="h-4 w-4 text-black" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setMapType("satellite")}>Satellite</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMapType("terrain")}>Terrain</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMapType("roadmap")}>Street</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="absolute bottom-3 right-3">
              <Button
                variant="secondary"
                size="icon"
                onClick={locateUser}
                className="h-10 w-10 shadow-lg"
                title="Locate Me"
              >
                <Locate className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
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

          {locationType === "lot" && (
            <div className="space-y-2">
              <Label htmlFor="lot">Select Lot *</Label>
              <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                <SelectTrigger id="lot">
                  <SelectValue placeholder="Choose a lot..." />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.lot_number} {lot.neighborhoods?.name && `(${lot.neighborhoods.name})`}
                      {lot.address && ` - ${lot.address}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(locationType === "facility" || locationType === "walking_path") && neighborhoods.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Neighborhood (Optional)</Label>
              <Select value={selectedNeighborhoodId} onValueChange={setSelectedNeighborhoodId}>
                <SelectTrigger id="neighborhood">
                  <SelectValue placeholder="Choose a neighborhood..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {neighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood.id} value={neighborhood.id}>
                      {neighborhood.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
