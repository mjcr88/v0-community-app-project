"use client"

import { useState } from "react"
import { APIProvider, Map, Marker, InfoWindow } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { Plus, Locate, Layers, ZoomIn, ZoomOut } from "lucide-react"
import Link from "next/link"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Location {
  id: string
  name: string
  type: "facility" | "lot" | "walking_path"
  coordinates?: { lat: number; lng: number }
  boundary_coordinates?: Array<[number, number]>
  path_coordinates?: Array<[number, number]>
  description?: string
  icon?: string
}

interface GoogleMapViewerProps {
  tenantSlug: string
  initialLocations: Location[]
  mapCenter?: { lat: number; lng: number } | null
  mapZoom?: number
  isAdmin?: boolean
}

export function GoogleMapViewer({
  tenantSlug,
  initialLocations,
  mapCenter,
  mapZoom = 15,
  isAdmin = false,
}: GoogleMapViewerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [center, setCenter] = useState<{ lat: number; lng: number }>(mapCenter || { lat: 9.7489, lng: -84.0907 })
  const [zoom, setZoom] = useState(mapZoom)
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">("satellite")

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setZoom(16)
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }

  const toggleMapType = () => {
    setMapType((prev) => {
      if (prev === "satellite") return "terrain"
      if (prev === "terrain") return "roadmap"
      return "satellite"
    })
  }

  const facilityMarkers = initialLocations.filter((loc) => loc.type === "facility" && loc.coordinates)
  const facilityPolygons = initialLocations.filter((loc) => loc.type === "facility" && loc.boundary_coordinates)
  const lotPolygons = initialLocations.filter((loc) => loc.type === "lot" && loc.boundary_coordinates)
  const walkingPaths = initialLocations.filter((loc) => loc.type === "walking_path" && loc.path_coordinates)

  const getPolygonCenter = (coordinates: Array<[number, number]>): { lat: number; lng: number } => {
    const sum = coordinates.reduce(
      (acc, coord) => {
        return { lat: acc.lat + coord[0], lng: acc.lng + coord[1] }
      },
      { lat: 0, lng: 0 },
    )
    return { lat: sum.lat / coordinates.length, lng: sum.lng / coordinates.length }
  }

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-muted rounded-lg">
        <p className="text-muted-foreground">Google Maps API key is missing</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div className="h-[600px] w-full rounded-lg overflow-hidden border">
        <APIProvider apiKey={apiKey}>
          <Map
            center={center}
            zoom={zoom}
            mapTypeId={mapType}
            gestureHandling="greedy"
            disableDefaultUI={true}
            onCenterChanged={(e) => setCenter(e.detail.center)}
            onZoomChanged={(e) => setZoom(e.detail.zoom)}
          >
            {/* Facility Markers */}
            {facilityMarkers.map((location) => (
              <Marker
                key={location.id}
                position={location.coordinates!}
                onClick={() => setSelectedLocation(location)}
              />
            ))}

            {/* Facility Polygons */}
            {facilityPolygons.map((location) => {
              const paths = location.boundary_coordinates!.map((coord) => ({ lat: coord[0], lng: coord[1] }))
              return (
                <Polygon
                  key={location.id}
                  paths={paths}
                  strokeColor="#22c55e"
                  strokeOpacity={0.8}
                  strokeWeight={2}
                  fillColor="#22c55e"
                  fillOpacity={0.2}
                  onClick={() => setSelectedLocation(location)}
                />
              )
            })}

            {/* Lot Polygons */}
            {lotPolygons.map((location) => {
              const paths = location.boundary_coordinates!.map((coord) => ({ lat: coord[0], lng: coord[1] }))
              return (
                <Polygon
                  key={location.id}
                  paths={paths}
                  strokeColor="#3b82f6"
                  strokeOpacity={0.8}
                  strokeWeight={2}
                  fillColor="#3b82f6"
                  fillOpacity={0.2}
                  onClick={() => setSelectedLocation(location)}
                />
              )
            })}

            {/* Walking Paths */}
            {walkingPaths.map((location) => {
              const path = location.path_coordinates!.map((coord) => ({ lat: coord[0], lng: coord[1] }))
              return (
                <Polyline key={location.id} path={path} strokeColor="#f59e0b" strokeOpacity={0.8} strokeWeight={3} />
              )
            })}

            {/* Info Window */}
            {selectedLocation && (
              <InfoWindow
                position={
                  selectedLocation.coordinates ||
                  getPolygonCenter(
                    selectedLocation.boundary_coordinates || selectedLocation.path_coordinates || [[0, 0]],
                  )
                }
                onCloseClick={() => setSelectedLocation(null)}
              >
                <div className="p-2">
                  <h3 className="font-semibold text-sm">
                    {selectedLocation.icon} {selectedLocation.name}
                  </h3>
                  {selectedLocation.description && (
                    <p className="text-gray-600 text-xs mt-1">{selectedLocation.description}</p>
                  )}
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {isAdmin && (
        <div className="absolute top-3 left-3 z-[1000]">
          <Button asChild size="icon" className="shadow-lg h-10 w-10">
            <Link href={`/t/${tenantSlug}/admin/map/locations/create`}>
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      )}

      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(zoom + 1)}
          className="h-10 w-10 shadow-lg"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(zoom - 1)}
          className="h-10 w-10 shadow-lg"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute bottom-3 left-3 z-[1000] flex gap-2">
        <Select value={mapType} onValueChange={(v) => setMapType(v as any)}>
          <SelectTrigger className="w-32 shadow-lg bg-background">
            <Layers className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="satellite">Satellite</SelectItem>
            <SelectItem value="terrain">Terrain</SelectItem>
            <SelectItem value="roadmap">Street</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="secondary" size="icon" onClick={handleLocate} className="shadow-lg" title="Locate Me">
          <Locate className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute bottom-3 right-3 bg-background p-3 rounded-lg shadow-lg z-[1000] border">
        <h3 className="font-semibold text-sm mb-2">Legend</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Facilities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 opacity-50" />
            <span>Lot Boundaries</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-amber-500" />
            <span>Walking Paths</span>
          </div>
        </div>
      </div>
    </div>
  )
}
