"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Button } from "@/components/ui/button"
import { Locate, Plus } from "lucide-react"
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
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      console.error("[v0] Mapbox token not found")
      return
    }

    mapboxgl.accessToken = token

    // Default to Costa Rica if no center provided
    const defaultCenter: [number, number] = mapCenter ? [mapCenter.lng, mapCenter.lat] : [-84.0907, 9.7489] // Costa Rica center

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: defaultCenter,
      zoom: mapZoom,
      pitch: 0,
      bearing: 0,
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")
    map.current.addControl(new mapboxgl.ScaleControl(), "bottom-left")

    map.current.on("load", () => {
      console.log("[v0] Map loaded successfully")
      setIsLoaded(true)
    })

    return () => {
      map.current?.remove()
    }
  }, [mapCenter, mapZoom])

  // Add locations to map
  useEffect(() => {
    if (!map.current || !isLoaded) return

    console.log("[v0] Adding locations to map:", initialLocations.length)

    // Add facility markers
    initialLocations.forEach((location) => {
      if (location.type === "facility" && location.coordinates) {
        const marker = new mapboxgl.Marker({ color: "#22c55e" })
          .setLngLat([location.coordinates.lng, location.coordinates.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="p-2">
                <h3 class="font-semibold">${location.icon || "📍"} ${location.name}</h3>
                ${location.description ? `<p class="text-sm text-gray-600">${location.description}</p>` : ""}
              </div>`,
            ),
          )
          .addTo(map.current!)
      }

      // Add lot boundaries
      if (location.type === "lot" && location.boundary_coordinates) {
        const sourceId = `lot-${location.id}`

        if (!map.current!.getSource(sourceId)) {
          map.current!.addSource(sourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: { name: location.name },
              geometry: {
                type: "Polygon",
                coordinates: [location.boundary_coordinates.map((coord) => [coord[1], coord[0]])],
              },
            },
          })

          map.current!.addLayer({
            id: `${sourceId}-fill`,
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": "#3b82f6",
              "fill-opacity": 0.2,
            },
          })

          map.current!.addLayer({
            id: `${sourceId}-outline`,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": "#3b82f6",
              "line-width": 2,
            },
          })
        }
      }

      // Add walking paths
      if (location.type === "walking_path" && location.path_coordinates) {
        const sourceId = `path-${location.id}`

        if (!map.current!.getSource(sourceId)) {
          map.current!.addSource(sourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: { name: location.name },
              geometry: {
                type: "LineString",
                coordinates: location.path_coordinates.map((coord) => [coord[1], coord[0]]),
              },
            },
          })

          map.current!.addLayer({
            id: sourceId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": "#f59e0b",
              "line-width": 3,
              "line-dasharray": [2, 2],
            },
          })
        }
      }
    })
  }, [initialLocations, isLoaded])

  // Find user location
  const handleFindLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })

        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 17,
            duration: 2000,
          })

          // Add user location marker
          new mapboxgl.Marker({ color: "#ef4444" })
            .setLngLat([longitude, latitude])
            .setPopup(new mapboxgl.Popup().setHTML("<p>You are here</p>"))
            .addTo(map.current)
        }
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
        alert("Unable to retrieve your location")
      },
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map controls overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <Button onClick={handleFindLocation} size="icon" variant="secondary" className="shadow-lg">
          <Locate className="h-4 w-4" />
        </Button>

        {isAdmin && (
          <Button asChild size="icon" className="shadow-lg">
            <Link href={`/t/${tenantSlug}/admin/map/locations/create`}>
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

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
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Your Location</span>
          </div>
        </div>
      </div>
    </div>
  )
}
