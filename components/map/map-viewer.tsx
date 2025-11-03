"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Plus, Locate } from "lucide-react"
import Link from "next/link"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
const Polygon = dynamic(() => import("react-leaflet").then((mod) => mod.Polygon), { ssr: false })
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false })
const useMap = dynamic(() => import("react-leaflet").then((mod) => mod.useMap), { ssr: false })

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

function LocationButton() {
  const map = useMap()

  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 16 })
  }

  return (
    <Button onClick={handleLocate} size="icon" className="absolute top-4 right-4 z-[1000] shadow-lg">
      <Locate className="h-4 w-4" />
    </Button>
  )
}

export function MapViewer({ tenantSlug, initialLocations, mapCenter, mapZoom = 15, isAdmin = false }: MapViewerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const center: [number, number] = [mapCenter?.lat || 9.7489, mapCenter?.lng || -84.0907]

  if (!token) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-red-600">Mapbox token not configured</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer center={center} zoom={mapZoom} style={{ width: "100%", height: "100%" }} className="z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
          url={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${token}`}
          tileSize={512}
          zoomOffset={-1}
        />

        {/* Facility Markers */}
        {initialLocations
          .filter((loc) => loc.type === "facility" && loc.coordinates)
          .map((location) => (
            <Marker
              key={location.id}
              position={[location.coordinates!.lat, location.coordinates!.lng]}
              eventHandlers={{
                click: () => setSelectedLocation(location),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-semibold">
                    {location.icon} {location.name}
                  </h3>
                  {location.description && <p className="text-gray-600 mt-1">{location.description}</p>}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Lot Boundaries */}
        {initialLocations
          .filter((loc) => loc.type === "lot" && loc.boundary_coordinates)
          .map((location) => (
            <Polygon
              key={`lot-${location.id}`}
              positions={location.boundary_coordinates!}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.2,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-semibold">{location.name}</h3>
                  {location.description && <p className="text-gray-600 mt-1">{location.description}</p>}
                </div>
              </Popup>
            </Polygon>
          ))}

        {/* Walking Paths */}
        {initialLocations
          .filter((loc) => loc.type === "walking_path" && loc.path_coordinates)
          .map((location) => (
            <Polyline
              key={`path-${location.id}`}
              positions={location.path_coordinates!}
              pathOptions={{
                color: "#f59e0b",
                weight: 3,
                dashArray: "10, 10",
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-semibold">{location.name}</h3>
                  {location.description && <p className="text-gray-600 mt-1">{location.description}</p>}
                </div>
              </Popup>
            </Polyline>
          ))}

        {/* Location Button */}
        <LocationButton />
      </MapContainer>

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
