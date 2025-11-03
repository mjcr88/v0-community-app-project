"use client"

import { useState } from "react"
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { Plus, Locate, Layers } from "lucide-react"
import Link from "next/link"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"

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
      <div className="h-[600px] w-full">
        <APIProvider apiKey={apiKey}>
          <Map
            center={center}
            zoom={zoom}
            mapTypeId={mapType}
            gestureHandling="greedy"
            disableDefaultUI={false}
            onCenterChanged={(e) => setCenter(e.detail.center)}
            onZoomChanged={(e) => setZoom(e.detail.zoom)}
          >
            {/* Facility Markers */}
            {facilityMarkers.map((location) => (
              <AdvancedMarker
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

      <Button
        onClick={toggleMapType}
        size="icon"
        variant="secondary"
        className="absolute top-4 right-16 z-[1000] shadow-lg"
        title={`Current: ${mapType}. Click to switch.`}
      >
        <Layers className="h-4 w-4" />
      </Button>

      <Button onClick={handleLocate} size="icon" className="absolute top-4 right-4 z-[1000] shadow-lg">
        <Locate className="h-4 w-4" />
      </Button>

      {isAdmin && (
        <div className="absolute top-4 left-4 z-[1000]">
          <Button asChild size="icon" className="shadow-lg">
            <Link href={`/t/${tenantSlug}/admin/map/locations/create`}>
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-[1000]">
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
            <div className="w-8 h-0.5 bg-amber-500 border-dashed" />
            <span>Walking Paths</span>
          </div>
        </div>
      </div>
    </div>
  )
}
