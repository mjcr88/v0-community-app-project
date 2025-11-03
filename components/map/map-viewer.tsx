"use client"

import { useState } from "react"
import { Map, Marker, Overlay } from "pigeon-maps"
import { Button } from "@/components/ui/button"
import { Plus, Locate, Layers } from "lucide-react"
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

function esriSatelliteProvider(x: number, y: number, z: number) {
  // ESRI World Imagery - free satellite tiles that work without authentication
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
}

function openTopoMapProvider(x: number, y: number, z: number) {
  // OpenTopoMap - free topographic/terrain tiles
  return `https://tile.opentopomap.org/${z}/${x}/${y}.png`
}

export function MapViewer({ tenantSlug, initialLocations, mapCenter, mapZoom = 15, isAdmin = false }: MapViewerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [center, setCenter] = useState<[number, number]>([mapCenter?.lat || 9.7489, mapCenter?.lng || -84.0907])
  const [zoom, setZoom] = useState(mapZoom)
  const [tileLayer, setTileLayer] = useState<"satellite" | "terrain">("satellite")

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

  const toggleTileLayer = () => {
    setTileLayer((prev) => (prev === "satellite" ? "terrain" : "satellite"))
  }

  const facilityMarkers = initialLocations.filter((loc) => loc.type === "facility" && loc.coordinates)
  const facilityPolygons = initialLocations.filter((loc) => loc.type === "facility" && loc.boundary_coordinates)
  const lotPolygons = initialLocations.filter((loc) => loc.type === "lot" && loc.boundary_coordinates)
  const walkingPaths = initialLocations.filter((loc) => loc.type === "walking_path" && loc.path_coordinates)

  const latLngToPixel = (lat: number, lng: number, mapZoom: number): [number, number] => {
    const scale = 256 * Math.pow(2, mapZoom)
    const worldX = ((lng + 180) / 360) * scale
    const worldY =
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * scale
    return [worldX, worldY]
  }

  const getPolygonCenter = (coordinates: Array<[number, number]>): [number, number] => {
    const sum = coordinates.reduce(
      (acc, coord) => {
        return [acc[0] + coord[0], acc[1] + coord[1]]
      },
      [0, 0],
    )
    return [sum[0] / coordinates.length, sum[1] / coordinates.length]
  }

  return (
    <div className="relative w-full h-full">
      <Map
        provider={tileLayer === "satellite" ? esriSatelliteProvider : openTopoMapProvider}
        center={center}
        zoom={zoom}
        onBoundsChanged={({ center: newCenter, zoom: newZoom }) => {
          setCenter(newCenter)
          setZoom(newZoom)
        }}
        height={600}
      >
        {facilityPolygons.map((location) => {
          const coords = location.boundary_coordinates!
          const centerPoint = getPolygonCenter(coords)
          const [centerX, centerY] = latLngToPixel(centerPoint[0], centerPoint[1], zoom)

          return (
            <Overlay key={`polygon-${location.id}`} anchor={centerPoint}>
              <svg
                style={{
                  position: "absolute",
                  pointerEvents: "none",
                  width: "100%",
                  height: "100%",
                  left: -centerX,
                  top: -centerY,
                }}
              >
                <polygon
                  points={coords
                    .map((coord) => {
                      const [x, y] = latLngToPixel(coord[0], coord[1], zoom)
                      return `${x},${y}`
                    })
                    .join(" ")}
                  fill="rgba(34, 197, 94, 0.2)"
                  stroke="#22c55e"
                  strokeWidth="2"
                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                  onClick={() => setSelectedLocation(location)}
                />
              </svg>
            </Overlay>
          )
        })}

        {lotPolygons.map((location) => {
          const coords = location.boundary_coordinates!
          const centerPoint = getPolygonCenter(coords)
          const [centerX, centerY] = latLngToPixel(centerPoint[0], centerPoint[1], zoom)

          return (
            <Overlay key={`lot-${location.id}`} anchor={centerPoint}>
              <svg
                style={{
                  position: "absolute",
                  pointerEvents: "none",
                  width: "100%",
                  height: "100%",
                  left: -centerX,
                  top: -centerY,
                }}
              >
                <polygon
                  points={coords
                    .map((coord) => {
                      const [x, y] = latLngToPixel(coord[0], coord[1], zoom)
                      return `${x},${y}`
                    })
                    .join(" ")}
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                  onClick={() => setSelectedLocation(location)}
                />
              </svg>
            </Overlay>
          )
        })}

        {walkingPaths.map((location) => {
          const coords = location.path_coordinates!
          const centerPoint = getPolygonCenter(coords)
          const [centerX, centerY] = latLngToPixel(centerPoint[0], centerPoint[1], zoom)

          return (
            <Overlay key={`path-${location.id}`} anchor={centerPoint}>
              <svg
                style={{
                  position: "absolute",
                  pointerEvents: "none",
                  width: "100%",
                  height: "100%",
                  left: -centerX,
                  top: -centerY,
                }}
              >
                <polyline
                  points={coords
                    .map((coord) => {
                      const [x, y] = latLngToPixel(coord[0], coord[1], zoom)
                      return `${x},${y}`
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                  onClick={() => setSelectedLocation(location)}
                />
              </svg>
            </Overlay>
          )
        })}

        {facilityMarkers.map((location) => (
          <Marker
            key={location.id}
            anchor={[location.coordinates!.lat, location.coordinates!.lng]}
            color="#22c55e"
            onClick={() => setSelectedLocation(location)}
          />
        ))}

        {selectedLocation && (
          <Overlay
            anchor={
              selectedLocation.coordinates
                ? [selectedLocation.coordinates.lat, selectedLocation.coordinates.lng]
                : getPolygonCenter(
                    selectedLocation.boundary_coordinates || selectedLocation.path_coordinates || [[0, 0]],
                  )
            }
            offset={[0, -40]}
          >
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

      <Button
        onClick={toggleTileLayer}
        size="icon"
        variant="secondary"
        className="absolute top-4 right-16 z-[1000] shadow-lg"
        title={`Switch to ${tileLayer === "satellite" ? "terrain" : "satellite"} view`}
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
