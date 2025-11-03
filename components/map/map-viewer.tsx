"use client"

import { useState } from "react"
import { Map, Marker, Overlay } from "pigeon-maps"
import { Button } from "@/components/ui/button"
import { Plus, Locate } from "lucide-react"
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

function mapboxProvider(x: number, y: number, z: number, dpr?: number) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/${z}/${x}/${y}${dpr && dpr >= 2 ? "@2x" : ""}?access_token=${token}`
}

export function MapViewer({ tenantSlug, initialLocations, mapCenter, mapZoom = 15, isAdmin = false }: MapViewerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [center, setCenter] = useState<[number, number]>([mapCenter?.lat || 9.7489, mapCenter?.lng || -84.0907])
  const [zoom, setZoom] = useState(mapZoom)

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!token) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-red-600">Mapbox token not configured</p>
      </div>
    )
  }

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude])
          setZoom(16)
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }

  const facilityMarkers = initialLocations.filter((loc) => loc.type === "facility" && loc.coordinates)

  return (
    <div className="relative w-full h-full">
      <Map
        provider={mapboxProvider}
        center={center}
        zoom={zoom}
        onBoundsChanged={({ center: newCenter, zoom: newZoom }) => {
          setCenter(newCenter)
          setZoom(newZoom)
        }}
        height={600}
      >
        {facilityMarkers.map((location) => (
          <Marker
            key={location.id}
            anchor={[location.coordinates!.lat, location.coordinates!.lng]}
            color="#22c55e"
            onClick={() => setSelectedLocation(location)}
          />
        ))}

        {selectedLocation && selectedLocation.coordinates && (
          <Overlay anchor={[selectedLocation.coordinates.lat, selectedLocation.coordinates.lng]} offset={[0, -40]}>
            <div className="bg-white p-3 rounded-lg shadow-lg max-w-xs relative">
              <button
                onClick={() => setSelectedLocation(null)}
                className="absolute top-1 right-1 text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
              <h3 className="font-semibold text-sm">
                {selectedLocation.icon} {selectedLocation.name}
              </h3>
              {selectedLocation.description && (
                <p className="text-gray-600 text-xs mt-1">{selectedLocation.description}</p>
              )}
            </div>
          </Overlay>
        )}
      </Map>

      {/* Location Button */}
      <Button onClick={handleLocate} size="icon" className="absolute top-4 right-4 z-[1000] shadow-lg">
        <Locate className="h-4 w-4" />
      </Button>

      {/* Add Location Button (Admin only) */}
      {isAdmin && (
        <div className="absolute top-4 left-4 z-[1000]">
          <Button asChild size="icon" className="shadow-lg">
            <Link href={`/t/${tenantSlug}/admin/map/locations/create`}>
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Legend */}
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
