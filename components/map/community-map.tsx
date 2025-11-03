"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { MAPBOX_TOKEN, MAPBOX_STYLES, DEFAULT_MAP_CONFIG, type Location } from "@/lib/mapbox"
import { Button } from "@/components/ui/button"
import { Locate } from "lucide-react"
import type GeoJSON from "geojson"

interface CommunityMapProps {
  locations?: Location[]
  center?: [number, number]
  zoom?: number
  onLocationClick?: (location: Location) => void
  showControls?: boolean
  className?: string
}

export function CommunityMap({
  locations = [],
  center = DEFAULT_MAP_CONFIG.center,
  zoom = DEFAULT_MAP_CONFIG.zoom,
  onLocationClick,
  showControls = true,
  className = "",
}: CommunityMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLES.satellite,
      center,
      zoom,
      minZoom: DEFAULT_MAP_CONFIG.minZoom,
      maxZoom: DEFAULT_MAP_CONFIG.maxZoom,
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

    // Add scale control
    map.current.addControl(
      new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: "metric",
      }),
      "bottom-left",
    )

    map.current.on("load", () => {
      setMapLoaded(true)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [center, zoom])

  // Add locations to map
  useEffect(() => {
    if (!map.current || !mapLoaded || locations.length === 0) return

    // Remove existing layers and sources
    if (map.current.getLayer("lots-fill")) map.current.removeLayer("lots-fill")
    if (map.current.getLayer("lots-outline")) map.current.removeLayer("lots-outline")
    if (map.current.getLayer("paths")) map.current.removeLayer("paths")
    if (map.current.getSource("lots")) map.current.removeSource("lots")
    if (map.current.getSource("paths")) map.current.removeSource("paths")

    // Separate locations by type
    const lots = locations.filter((loc) => loc.type === "lot" && loc.boundary_coordinates)
    const paths = locations.filter((loc) => loc.type === "walking_path" && loc.path_coordinates)
    const facilities = locations.filter((loc) => loc.type === "facility" && loc.coordinates)

    // Add lot boundaries
    if (lots.length > 0) {
      const lotsGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: lots.map((lot) => ({
          type: "Feature",
          properties: {
            id: lot.id,
            name: lot.name,
            description: lot.description,
          },
          geometry: {
            type: "Polygon",
            coordinates: [lot.boundary_coordinates!.map((coord) => [coord.lng, coord.lat])],
          },
        })),
      }

      map.current.addSource("lots", {
        type: "geojson",
        data: lotsGeoJSON,
      })

      map.current.addLayer({
        id: "lots-fill",
        type: "fill",
        source: "lots",
        paint: {
          "fill-color": "#10b981",
          "fill-opacity": 0.2,
        },
      })

      map.current.addLayer({
        id: "lots-outline",
        type: "line",
        source: "lots",
        paint: {
          "line-color": "#10b981",
          "line-width": 2,
        },
      })
    }

    // Add walking paths
    if (paths.length > 0) {
      const pathsGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: paths.map((path) => ({
          type: "Feature",
          properties: {
            id: path.id,
            name: path.name,
            surface: path.path_surface,
            difficulty: path.path_difficulty,
          },
          geometry: {
            type: "LineString",
            coordinates: path.path_coordinates!.map((coord) => [coord.lng, coord.lat]),
          },
        })),
      }

      map.current.addSource("paths", {
        type: "geojson",
        data: pathsGeoJSON,
      })

      map.current.addLayer({
        id: "paths",
        type: "line",
        source: "paths",
        paint: {
          "line-color": "#f59e0b",
          "line-width": 3,
          "line-dasharray": [2, 2],
        },
      })
    }

    // Add facility markers
    facilities.forEach((facility) => {
      const el = document.createElement("div")
      el.className = "facility-marker"
      el.style.width = "32px"
      el.style.height = "32px"
      el.style.borderRadius = "50%"
      el.style.backgroundColor = "#3b82f6"
      el.style.border = "2px solid white"
      el.style.cursor = "pointer"
      el.style.display = "flex"
      el.style.alignItems = "center"
      el.style.justifyContent = "center"
      el.style.fontSize = "16px"
      el.textContent = facility.icon || "📍"

      const marker = new mapboxgl.Marker(el)
        .setLngLat([facility.coordinates!.lng, facility.coordinates!.lat])
        .addTo(map.current!)

      if (onLocationClick) {
        el.addEventListener("click", () => onLocationClick(facility))
      }
    })
  }, [mapLoaded, locations, onLocationClick])

  // Get user location
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      console.error("[v0] Geolocation not supported")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude]
        setUserLocation(coords)

        if (map.current) {
          map.current.flyTo({
            center: coords,
            zoom: 17,
            duration: 1500,
          })

          // Add user location marker
          new mapboxgl.Marker({ color: "#ef4444" }).setLngLat(coords).addTo(map.current)
        }
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
      },
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />

      {showControls && (
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <Button size="icon" variant="secondary" onClick={handleLocateUser} title="Find my location">
            <Locate className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
