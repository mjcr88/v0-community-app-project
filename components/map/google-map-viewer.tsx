"use client"

import { useState } from "react"
import { APIProvider, Map, Marker, InfoWindow } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { Plus, Locate, Layers, Filter } from "lucide-react"
import Link from "next/link"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

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
  communityBoundary?: Array<[number, number]> | null
}

export function GoogleMapViewer({
  tenantSlug,
  initialLocations,
  mapCenter,
  mapZoom = 15,
  isAdmin = false,
  communityBoundary,
}: GoogleMapViewerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [center, setCenter] = useState<{ lat: number; lng: number }>(mapCenter || { lat: 9.9567, lng: -84.5333 })
  const [zoom, setZoom] = useState(mapZoom)
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">("satellite")

  const [showFacilities, setShowFacilities] = useState(true)
  const [showLots, setShowLots] = useState(true)
  const [showWalkingPaths, setShowWalkingPaths] = useState(true)

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

  const facilityMarkers = initialLocations.filter((loc) => showFacilities && loc.type === "facility" && loc.coordinates)
  const facilityPolygons = initialLocations.filter(
    (loc) => showFacilities && loc.type === "facility" && loc.boundary_coordinates,
  )
  const lotPolygons = initialLocations.filter((loc) => showLots && loc.type === "lot" && loc.boundary_coordinates)
  const walkingPaths = initialLocations.filter(
    (loc) => showWalkingPaths && loc.type === "walking_path" && loc.path_coordinates,
  )

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
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <p className="text-muted-foreground">Google Maps API key is missing</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full relative rounded-lg border overflow-hidden">
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
          {communityBoundary && communityBoundary.length >= 3 && (
            <Polygon
              paths={communityBoundary.map((coord) => ({ lat: coord[0], lng: coord[1] }))}
              strokeColor="#10b981"
              strokeOpacity={0.6}
              strokeWeight={2}
              fillColor="#10b981"
              fillOpacity={0.18}
              clickable={false}
            />
          )}

          {/* Facility Markers */}
          {facilityMarkers.map((location) => (
            <Marker key={location.id} position={location.coordinates!} onClick={() => setSelectedLocation(location)} />
          ))}

          {/* Facility Polygons */}
          {facilityPolygons.map((location) => {
            const paths = location.boundary_coordinates!.map((coord) => ({ lat: coord[0], lng: coord[1] }))
            return (
              <Polygon
                key={location.id}
                paths={paths}
                strokeColor="#86efac"
                strokeOpacity={0.6}
                strokeWeight={1.5}
                fillColor="#86efac"
                fillOpacity={0.15}
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
                strokeColor="#93c5fd"
                strokeOpacity={0.6}
                strokeWeight={1.5}
                fillColor="#93c5fd"
                fillOpacity={0.15}
                onClick={() => setSelectedLocation(location)}
              />
            )
          })}

          {/* Walking Paths */}
          {walkingPaths.map((location) => {
            const path = location.path_coordinates!.map((coord) => ({ lat: coord[0], lng: coord[1] }))
            return (
              <Polyline key={location.id} path={path} strokeColor="#fcd34d" strokeOpacity={0.7} strokeWeight={2.5} />
            )
          })}

          {/* Info Window */}
          {selectedLocation && (
            <InfoWindow
              position={
                selectedLocation.coordinates ||
                getPolygonCenter(selectedLocation.boundary_coordinates || selectedLocation.path_coordinates || [[0, 0]])
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

      {/* Top left: Zoom controls */}
      <div className="absolute left-3 top-3 flex flex-col gap-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(zoom + 1)}
          className="h-10 w-10 shadow-lg"
          title="Zoom In"
        >
          +
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(zoom - 1)}
          className="h-10 w-10 shadow-lg"
          title="Zoom Out"
        >
          −
        </Button>
      </div>

      {/* Bottom left: Add location button (admin only) */}
      {isAdmin && (
        <div className="absolute bottom-3 left-3 z-10">
          <Button asChild size="icon" className="shadow-lg h-10 w-10">
            <Link href={`/t/${tenantSlug}/admin/map/locations/create`}>
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      )}

      {/* Top right: Controls */}
      <div className="absolute right-3 top-3 z-10 flex gap-2">
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

        {/* Layer selector */}
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

      {/* Bottom right: Locate me */}
      <div className="absolute bottom-3 right-3 z-10">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleLocate}
          className="h-10 w-10 shadow-lg"
          title="Locate Me"
        >
          <Locate className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
