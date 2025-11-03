"use client"

import { useState, useRef } from "react"
import Map, { Marker, Source, Layer, NavigationControl, ScaleControl, GeolocateControl } from "react-map-gl/maplibre"
import type { MapRef } from "react-map-gl/maplibre"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

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

interface MapViewerProps {
  tenantSlug: string
  initialLocations: Location[]
  mapCenter?: { lat: number; lng: number } | null
  mapZoom?: number
  isAdmin?: boolean
}

export function MapViewer({ tenantSlug, initialLocations, mapCenter, mapZoom = 15, isAdmin = false }: MapViewerProps) {
  const mapRef = useRef<MapRef>(null)

  const [viewState, setViewState] = useState({
    longitude: mapCenter?.lng || -84.0907, // Default to Costa Rica
    latitude: mapCenter?.lat || 9.7489,
    zoom: mapZoom,
  })

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!token) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-red-600">Mapbox token not configured</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={token}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        ref={mapRef}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-left" />
        <GeolocateControl position="top-right" trackUserLocation showUserHeading />

        {/* Facility Markers */}
        {initialLocations
          .filter((loc) => loc.type === "facility" && loc.coordinates)
          .map((location) => (
            <Marker
              key={location.id}
              longitude={location.coordinates!.lng}
              latitude={location.coordinates!.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setSelectedLocation(location)
              }}
            >
              <div className="cursor-pointer transform hover:scale-110 transition-transform">
                <div className="bg-green-500 rounded-full p-2 shadow-lg">
                  <span className="text-white text-xl">{location.icon || "📍"}</span>
                </div>
              </div>
            </Marker>
          ))}

        {/* Lot Boundaries */}
        {initialLocations
          .filter((loc) => loc.type === "lot" && loc.boundary_coordinates)
          .map((location) => (
            <Source
              key={`lot-${location.id}`}
              type="geojson"
              data={{
                type: "Feature",
                properties: { name: location.name },
                geometry: {
                  type: "Polygon",
                  coordinates: [location.boundary_coordinates!.map((coord) => [coord[1], coord[0]])],
                },
              }}
            >
              <Layer
                id={`lot-${location.id}-fill`}
                type="fill"
                paint={{
                  "fill-color": "#3b82f6",
                  "fill-opacity": 0.2,
                }}
              />
              <Layer
                id={`lot-${location.id}-outline`}
                type="line"
                paint={{
                  "line-color": "#3b82f6",
                  "line-width": 2,
                }}
              />
            </Source>
          ))}

        {/* Walking Paths */}
        {initialLocations
          .filter((loc) => loc.type === "walking_path" && loc.path_coordinates)
          .map((location) => (
            <Source
              key={`path-${location.id}`}
              type="geojson"
              data={{
                type: "Feature",
                properties: { name: location.name },
                geometry: {
                  type: "LineString",
                  coordinates: location.path_coordinates!.map((coord) => [coord[1], coord[0]]),
                },
              }}
            >
              <Layer
                id={`path-${location.id}`}
                type="line"
                paint={{
                  "line-color": "#f59e0b",
                  "line-width": 3,
                  "line-dasharray": [2, 2],
                }}
              />
            </Source>
          ))}
      </Map>

      {/* Add Location Button (Admin only) */}
      {isAdmin && (
        <div className="absolute top-4 left-4">
          <Button asChild size="icon" className="shadow-lg">
            <Link href={`/t/${tenantSlug}/admin/map/locations/create`}>
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
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

      {/* Location Popup */}
      {selectedLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-xl max-w-sm">
          <button
            onClick={() => setSelectedLocation(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          <h3 className="font-semibold text-lg mb-1">
            {selectedLocation.icon} {selectedLocation.name}
          </h3>
          {selectedLocation.description && <p className="text-sm text-gray-600">{selectedLocation.description}</p>}
        </div>
      )}
    </div>
  )
}
