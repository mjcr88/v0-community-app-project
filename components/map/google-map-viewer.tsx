"use client"

import { GoogleMap, useJsApiLoader } from "@react-google-maps/api"
import { useState, useCallback, useMemo, memo } from "react"
import { LocationInfoCard } from "./location-info-card"
import { google } from "googlemaps"

interface GoogleMapViewerProps {
  locations: any[]
  tenantId: string
  mapCenter?: { lat: number; lng: number }
  mapZoom?: number
  highlightLocationId?: string
  minimal?: boolean
}

export const GoogleMapViewer = memo(function GoogleMapViewer({
  locations = [],
  tenantId,
  mapCenter,
  mapZoom = 15,
  highlightLocationId,
  minimal = false,
}: GoogleMapViewerProps) {
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  console.log("[v0] GoogleMapViewer mounted with:", {
    locationsCount: locations.length,
    highlightLocationId,
    minimal,
  })

  // Sample location for debugging
  if (locations.length > 0) {
    const sampleLocation = locations.find((l) => l.name === "D-001")
    if (sampleLocation) {
      const sampleStr = JSON.stringify(sampleLocation)
      console.log("[v0] Sample location D-001 data:", sampleStr.substring(0, 500))
    }
  }

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const handleLocationClick = useCallback((location: any) => {
    console.log("[v0] Location clicked:", location.name, location.id)
    setSelectedLocation(location)
  }, [])

  // Filter locations by type
  const lotLocations = useMemo(() => locations.filter((loc) => loc.type === "lot"), [locations])

  const roadLocations = useMemo(() => locations.filter((loc) => loc.type === "road"), [locations])

  const boundaryLocations = useMemo(() => locations.filter((loc) => loc.type === "boundary"), [locations])

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={mapCenter || { lat: 9.9, lng: -84.5 }}
        zoom={mapZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        mapId={undefined}
        options={{
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Render boundaries */}
        {boundaryLocations.map((location) => {
          if (location.geojson?.geometry?.type === "Polygon") {
            const coordinates = location.geojson.geometry.coordinates[0].map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }))

            return (
              <google.maps.Polygon
                key={location.id}
                paths={coordinates}
                options={{
                  fillColor: "#10b981",
                  fillOpacity: 0.1,
                  strokeColor: "#10b981",
                  strokeOpacity: 0.5,
                  strokeWeight: 2,
                }}
              />
            )
          }
          return null
        })}

        {/* Render roads */}
        {roadLocations.map((location) => {
          if (location.geojson?.geometry?.type === "LineString") {
            const path = location.geojson.geometry.coordinates.map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }))

            return (
              <google.maps.Polyline
                key={location.id}
                path={path}
                options={{
                  strokeColor: "#f59e0b",
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                }}
              />
            )
          }
          return null
        })}

        {/* Render lots */}
        {lotLocations.map((location) => {
          const isHighlighted = location.id === highlightLocationId
          const isSelected = location.id === selectedLocation?.id

          if (location.geojson?.geometry?.type === "Polygon") {
            const coordinates = location.geojson.geometry.coordinates[0].map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }))

            return (
              <google.maps.Polygon
                key={location.id}
                paths={coordinates}
                onClick={() => handleLocationClick(location)}
                options={{
                  fillColor: isHighlighted || isSelected ? "#f59e0b" : "#3b82f6",
                  fillOpacity: isHighlighted || isSelected ? 0.4 : 0.2,
                  strokeColor: isHighlighted || isSelected ? "#f59e0b" : "#3b82f6",
                  strokeOpacity: 0.8,
                  strokeWeight: isHighlighted || isSelected ? 3 : 2,
                  clickable: true,
                }}
              />
            )
          }

          if (location.geojson?.geometry?.type === "LineString") {
            const path = location.geojson.geometry.coordinates.map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }))

            console.log("[v0] Lot polyline clicked:", location.name)

            return (
              <google.maps.Polyline
                key={location.id}
                path={path}
                onClick={() => handleLocationClick(location)}
                options={{
                  strokeColor: isHighlighted || isSelected ? "#f59e0b" : "#3b82f6",
                  strokeOpacity: 0.8,
                  strokeWeight: isHighlighted || isSelected ? 4 : 3,
                  clickable: true,
                }}
              />
            )
          }

          return null
        })}
      </GoogleMap>

      {selectedLocation && (
        <div className="absolute right-4 top-4 z-10">
          <LocationInfoCard
            location={selectedLocation}
            tenantId={tenantId}
            onClose={() => setSelectedLocation(null)}
            minimal={minimal}
          />
        </div>
      )}
    </div>
  )
})
