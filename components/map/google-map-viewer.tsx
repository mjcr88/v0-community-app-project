"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { Plus, Locate, Layers, Filter, MapPin, Trash2 } from "lucide-react"
import Link from "next/link"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"
import { LocationInfoCard } from "./location-info-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { createBrowserClient } from "@/lib/supabase/client"
import React from "react"

interface Location {
  id: string
  name: string
  type: "facility" | "lot" | "walking_path" | "neighborhood" | "boundary" | "public_street"
  coordinates?: { lat: number; lng: number }
  boundary_coordinates?: Array<[number, number]>
  path_coordinates?: Array<[number, number]>
  description?: string | null
  icon?: string | null
  facility_type?: string | null
  photos?: string[] | null
  lot_id?: string | null
  neighborhood_id?: string
  tenant_id?: string
}

interface GoogleMapViewerProps {
  locations: Location[]
  tenantId?: string // Make tenantId optional
  mapCenter?: { lat: number; lng: number } | null
  mapZoom?: number
  isAdmin?: boolean
  highlightLocationId?: string
  selectedLocationId?: string
  minimal?: boolean
  onLocationClick?: (locationId: string) => void
  showInfoCard?: boolean
  drawingMode?: "marker" | "polygon" | null
  onDrawingModeChange?: (mode: "marker" | "polygon" | null) => void
  onDrawingComplete?: (data: {
    coordinates?: { lat: number; lng: number } | null
    type?: "pin" | "polygon" | null
    path?: Array<{ lat: number; lng: number }> | null
  }) => void
  drawnCoordinates?: { lat: number; lng: number } | null
  drawnPath?: Array<{ lat: number; lng: number }> | null
  drawnType?: "pin" | "polygon" | null
}

export const GoogleMapViewer = React.memo(function GoogleMapViewer({
  locations: initialLocations = [],
  tenantId, // Now optional
  mapCenter,
  mapZoom = 11,
  isAdmin = false,
  highlightLocationId,
  selectedLocationId,
  minimal = false,
  onLocationClick,
  showInfoCard = true,
  drawingMode = null,
  onDrawingModeChange,
  onDrawingComplete,
  drawnCoordinates,
  drawnPath,
  drawnType,
}: GoogleMapViewerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [initialHighlightId] = useState<string | undefined>(highlightLocationId)
  const [dynamicHighlightId, setDynamicHighlightId] = useState<string | undefined>(undefined)
  const [center, setCenter] = useState<{ lat: number; lng: number }>(mapCenter || { lat: 9.9567, lng: -84.5333 })
  const [zoom, setZoom] = useState(mapZoom)
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">("satellite")

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locatingUser, setLocatingUser] = useState(false)

  const [showFacilities, setShowFacilities] = useState(true)
  const [showLots, setShowLots] = useState(true)
  const [showWalkingPaths, setShowWalkingPaths] = useState(true)
  const [showNeighborhoods, setShowNeighborhoods] = useState(true)
  const [showBoundary, setShowBoundary] = useState(true)
  const [tenantBoundary, setTenantBoundary] = useState<Array<{ lat: number; lng: number }> | null>(null)
  const [boundaryLocationsFromTable, setBoundaryLocationsFromTable] = useState<Location[] | null>(null)

  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(drawnCoordinates || null)
  const [polygonPoints, setPolygonPoints] = useState<Array<{ lat: number; lng: number }>>(drawnPath || [])

  const [mapInstance, setMapInstance] = useState<any | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID

  const activeHighlightId = dynamicHighlightId || initialHighlightId
  const activeSelectedId = selectedLocationId

  useEffect(() => {
    console.log("[v0] GoogleMapViewer mounted with:", {
      locationsCount: initialLocations.length,
      highlightLocationId,
      selectedLocationId,
      minimal,
      mapCenter,
      mapZoom,
    })
  }, [])

  useEffect(() => {
    if (initialHighlightId) {
      const location = initialLocations.find((loc) => loc.id === initialHighlightId)
      if (location) {
        console.log("[v0] Auto-selecting initial highlight:", location.name, "type:", location.type)

        // Only show info card on full map (not minimal) and not for boundary types
        if (!minimal && location.type !== "boundary") {
          setSelectedLocation(location)
        }

        if (location.coordinates) {
          setCenter(location.coordinates)
          setZoom(17)
        } else if (location.boundary_coordinates && location.boundary_coordinates.length > 0) {
          const lats = location.boundary_coordinates.map((c) => c[0])
          const lngs = location.boundary_coordinates.map((c) => c[1])
          const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length
          const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
          setCenter({ lat: centerLat, lng: centerLng })
          setZoom(17)
        } else if (location.path_coordinates && location.path_coordinates.length > 0) {
          setCenter({ lat: location.path_coordinates[0][0], lng: location.path_coordinates[0][1] })
          setZoom(17)
        }
      }
    }
  }, [initialHighlightId, minimal, initialLocations])

  useEffect(() => {
    if (!tenantId) {
      console.log("[v0] No tenantId provided, skipping boundary load")
      return
    }

    const loadTenantBoundary = async () => {
      const supabase = createBrowserClient()
      const { data: tenant } = await supabase
        .from("tenants")
        .select("map_boundary_coordinates")
        .eq("id", tenantId)
        .single()

      if (tenant?.map_boundary_coordinates) {
        setTenantBoundary(tenant.map_boundary_coordinates as Array<{ lat: number; lng: number }>)
      }

      const { data: boundaryLocations } = await supabase
        .from("locations")
        .select("*")
        .eq("type", "boundary")
        .eq("tenant_id", tenantId)

      setBoundaryLocationsFromTable(boundaryLocations)
    }

    loadTenantBoundary()
  }, [tenantId])

  useEffect(() => {
    if (mapCenter) {
      console.log("[v0] Setting map center from prop:", mapCenter, "zoom:", mapZoom)
      setCenter(mapCenter)
      setZoom(mapZoom)
    }
  }, [mapCenter, mapZoom])

  const handlePlaceClick = useCallback(
    async (placeId: string) => {
      if (!mapInstance) return

      console.log("[v0] Place clicked:", placeId)

      if (typeof window === "undefined" || !window.google) {
        console.error("[v0] Google Maps API not loaded")
        return
      }

      // Use Places service to get details
      const service = new window.google.maps.places.PlacesService(mapInstance)

      service.getDetails(
        {
          placeId: placeId,
          fields: ["name", "formatted_address", "geometry.location", "displayName"],
        },
        (place, status) => {
          console.log("[v0] Place getDetails response - status:", status, "place:", place)

          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const lat = place.geometry?.location?.lat()
            const lng = place.geometry?.location?.lng()

            const name = place.name || place.formatted_address?.split(",")[0] || "Custom Location"

            console.log("[v0] Extracted data - lat:", lat, "lng:", lng, "name:", name)

            if (lat !== undefined && lng !== undefined && name) {
              console.log("[v0] Selected place:", { name, lat, lng })

              setMarkerPosition({ lat, lng })

              if (typeof onDrawingComplete === "function") {
                onDrawingComplete({
                  coordinates: { lat, lng },
                  type: "pin",
                  path: null,
                })
              }

              if (typeof window !== "undefined") {
                console.log("[v0] Dispatching placeSelected event with name:", name)
                window.dispatchEvent(
                  new CustomEvent("placeSelected", {
                    detail: { name, lat, lng },
                  }),
                )
              }

              // Exit drawing mode
              if (typeof onDrawingModeChange === "function") {
                onDrawingModeChange(null)
              }
            } else {
              console.error("[v0] Missing required place data - lat:", lat, "lng:", lng, "name:", name)
            }
          } else {
            console.error("[v0] Place getDetails failed - status:", status)
          }
        },
      )
    },
    [mapInstance, onDrawingComplete, onDrawingModeChange],
  )

  useEffect(() => {
    if (!mapInstance || !drawingMode) return

    console.log("[v0] Setting up place click listener")

    const listener = mapInstance.addListener("click", (e: any) => {
      if (e.placeId) {
        e.stop()
        handlePlaceClick(e.placeId)
      }
    })

    return () => {
      if (listener) {
        window.google?.maps?.event?.removeListener(listener)
      }
    }
  }, [mapInstance, drawingMode, handlePlaceClick])

  const facilityMarkers = useMemo(
    () => initialLocations.filter((loc) => showFacilities && loc.type === "facility" && loc.coordinates),
    [initialLocations, showFacilities],
  )
  const facilityPolygons = useMemo(
    () => initialLocations.filter((loc) => showFacilities && loc.type === "facility" && loc.boundary_coordinates),
    [initialLocations, showFacilities],
  )
  const facilityPolylines = useMemo(
    () => initialLocations.filter((loc) => showFacilities && loc.type === "facility" && loc.path_coordinates),
    [initialLocations, showFacilities],
  )
  const lotPolygons = useMemo(
    () => initialLocations.filter((loc) => showLots && loc.type === "lot" && loc.boundary_coordinates),
    [initialLocations, showLots],
  )
  const lotPolylines = useMemo(
    () => initialLocations.filter((loc) => showLots && loc.type === "lot" && loc.path_coordinates),
    [initialLocations, showLots],
  )
  const walkingPaths = useMemo(
    () => initialLocations.filter((loc) => showWalkingPaths && loc.type === "walking_path" && loc.path_coordinates),
    [initialLocations, showWalkingPaths],
  )
  const neighborhoodPolygons = useMemo(
    () =>
      initialLocations.filter((loc) => showNeighborhoods && loc.type === "neighborhood" && loc.boundary_coordinates),
    [initialLocations, showNeighborhoods],
  )
  const boundaryLocations = useMemo(
    () => initialLocations.filter((loc) => showBoundary && loc.type === "boundary" && loc.boundary_coordinates),
    [initialLocations, showBoundary],
  )
  const publicStreetPolylines = useMemo(
    () => initialLocations.filter((loc) => loc.type === "public_street" && loc.path_coordinates),
    [initialLocations],
  )
  const publicStreetPolygons = useMemo(
    () => initialLocations.filter((loc) => loc.type === "public_street" && loc.boundary_coordinates),
    [initialLocations],
  )

  const handleMapClick = useCallback(
    (e: any) => {
      console.log("[v0] Map clicked, drawingMode:", drawingMode, "latLng:", e.detail?.latLng)

      if (drawingMode === "marker" && e.detail?.latLng) {
        const lat = e.detail.latLng.lat
        const lng = e.detail.latLng.lng

        console.log("[v0] Dropping custom pin at:", { lat, lng })
        setMarkerPosition({ lat, lng })

        if (typeof onDrawingComplete === "function") {
          onDrawingComplete({
            coordinates: { lat, lng },
            type: "pin",
            path: null,
          })
        }
      } else if (!drawingMode) {
        console.log("[v0] Map clicked - clearing selection")
        setDynamicHighlightId(undefined)
        setSelectedLocation(null)
      }
    },
    [drawingMode, onDrawingComplete],
  )

  const clearDrawing = useCallback(() => {
    console.log("[v0] Clearing drawing")
    setMarkerPosition(null)

    if (typeof onDrawingComplete === "function") {
      onDrawingComplete({
        coordinates: null,
        type: null,
        path: null,
      })
    }
  }, [onDrawingComplete])

  const convertCoordinates = useCallback((coords: [number, number][]) => {
    return coords.map((coord) => ({
      lat: coord[0],
      lng: coord[1],
    }))
  }, [])

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("[v0] Geolocation is not supported by this browser")
      return
    }

    setLocatingUser(true)
    console.log("[v0] Requesting user location...")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        console.log("[v0] User location obtained:", userPos)
        setUserLocation(userPos)
        setCenter(userPos)
        setZoom(17)
        setLocatingUser(false)
      },
      (error) => {
        console.error("[v0] Error getting user location:", error)
        setLocatingUser(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }, [])

  const finishDrawing = useCallback(() => {
    if (drawingMode === "polygon" && polygonPoints.length >= 3) {
      if (onDrawingComplete) {
        onDrawingComplete({
          coordinates: null,
          type: "polygon",
          path: polygonPoints,
        })
      }
      if (onDrawingModeChange) {
        onDrawingModeChange(null)
      }
    }
  }, [drawingMode, polygonPoints, onDrawingComplete, onDrawingModeChange])

  const undoLastPoint = useCallback(() => {
    if (drawingMode === "polygon" && polygonPoints.length > 0) {
      setPolygonPoints(polygonPoints.slice(0, -1))
    }
  }, [drawingMode, polygonPoints])

  const handleLocationClick = useCallback(
    (location: Location) => {
      console.log("[v0] Location clicked:", location.name, location.id, "type:", location.type)

      if (onLocationClick) {
        console.log("[v0] Calling onLocationClick callback")
        onLocationClick(location.id)
        return
      }

      if (location.type === "boundary" || !showInfoCard) {
        console.log("[v0] Boundary or no info card - only highlighting")
        setDynamicHighlightId(location.id)
        setSelectedLocation(null)
        return
      }

      setDynamicHighlightId(location.id)
      setSelectedLocation(location)
    },
    [onLocationClick, showInfoCard],
  )

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <p className="text-muted-foreground">Google Maps API key is missing</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full relative rounded-lg border overflow-hidden">
      <APIProvider apiKey={apiKey} libraries={["places"]}>
        <Map
          center={center}
          zoom={zoom}
          mapTypeId={mapType}
          gestureHandling="greedy"
          disableDefaultUI={true}
          zoomControl={false}
          minZoom={10}
          maxZoom={22}
          restriction={undefined}
          clickableIcons={true}
          {...(mapId ? { mapId } : {})}
          onCenterChanged={(e) => setCenter(e.detail.center)}
          onZoomChanged={(e) => setZoom(e.detail.zoom)}
          onClick={handleMapClick}
          onLoad={(map) => {
            console.log("[v0] Map loaded, setting instance")
            setMapInstance(map.map)
          }}
        >
          {showBoundary && tenantBoundary && (
            <Polygon
              paths={convertCoordinates(tenantBoundary as any)}
              strokeColor="#3b82f6"
              strokeOpacity={0.6}
              strokeWeight={2}
              fillColor="#ffffff"
              fillOpacity={0.4}
              clickable={false}
              zIndex={1}
            />
          )}

          {boundaryLocations.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            return (
              <Polygon
                key={`${location.id}-boundary`}
                paths={paths}
                strokeColor="#3b82f6"
                strokeOpacity={0.8}
                strokeWeight={2}
                fillColor="transparent"
                fillOpacity={0}
                clickable={!isHighlighted}
                onClick={() => handleLocationClick(location)}
                zIndex={2}
              />
            )
          })}

          {boundaryLocationsFromTable?.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            return (
              <Polygon
                key={`${location.id}-boundary-table`}
                paths={paths}
                strokeColor="#3b82f6"
                strokeOpacity={0.8}
                strokeWeight={2}
                fillColor="transparent"
                fillOpacity={0}
                clickable={!isHighlighted}
                onClick={() => handleLocationClick(location)}
                zIndex={2}
              />
            )
          })}

          {neighborhoodPolygons.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const isSelected = activeSelectedId === location.id
            const zIndex = isSelected ? 300 : isHighlighted ? 250 : 50
            return (
              <React.Fragment key={location.id}>
                {/* Invisible wider clickable area */}
                <Polygon
                  paths={paths}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={12}
                  fillColor="transparent"
                  fillOpacity={0}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex}
                />
                {/* Visible polygon with fill */}
                <Polygon
                  paths={paths}
                  strokeColor={isSelected ? "#ef4444" : isHighlighted ? "#fca5a5" : "#c084fc"}
                  strokeOpacity={1}
                  strokeWeight={2}
                  fillColor={isSelected ? "#ef4444" : isHighlighted ? "#60a5fa" : "#e9d5ff"}
                  fillOpacity={isSelected ? 0.4 : isHighlighted ? 0.3 : 0.6}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {publicStreetPolylines.map((location) => {
            const path = convertCoordinates(location.path_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const isSelected = activeSelectedId === location.id
            const zIndex = isSelected ? 300 : isHighlighted ? 250 : 60
            return (
              <React.Fragment key={location.id}>
                <Polyline
                  path={path}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={12}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex}
                />
                <Polyline
                  path={path}
                  strokeColor={isSelected ? "#ef4444" : isHighlighted ? "#fca5a5" : "#fbbf24"}
                  strokeOpacity={1}
                  strokeWeight={2}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {publicStreetPolygons.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const isSelected = activeSelectedId === location.id
            const zIndex = isSelected ? 300 : isHighlighted ? 250 : 60
            return (
              <React.Fragment key={location.id}>
                <Polygon
                  paths={paths}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={12}
                  fillColor="transparent"
                  fillOpacity={0}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex}
                />
                <Polygon
                  paths={paths}
                  strokeColor={isSelected ? "#ef4444" : isHighlighted ? "#60a5fa" : "#fbbf24"}
                  strokeOpacity={1}
                  strokeWeight={2}
                  fillColor={isSelected ? "#ef4444" : isHighlighted ? "#60a5fa" : "#fef3c7"}
                  fillOpacity={isSelected ? 0.4 : isHighlighted ? 0.3 : 0.4}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {lotPolygons.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const isSelected = activeSelectedId === location.id
            const zIndex = isSelected ? 300 : isHighlighted ? 250 : 70
            return (
              <React.Fragment key={location.id}>
                {/* Invisible wider clickable area */}
                <Polygon
                  paths={paths}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={12}
                  fillColor="transparent"
                  fillOpacity={0}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex}
                />
                <Polygon
                  paths={paths}
                  strokeColor={isSelected ? "#ef4444" : isHighlighted ? "#ef4444" : "#10b981"}
                  strokeOpacity={1}
                  strokeWeight={2}
                  fillColor={isSelected ? "#ef4444" : isHighlighted ? "#60a5fa" : "#86efac"}
                  fillOpacity={isSelected ? 0.15 : isHighlighted ? 0.15 : 0.15}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {lotPolylines.map((location) => {
            const path = convertCoordinates(location.path_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const isSelected = activeSelectedId === location.id
            const zIndex = isSelected ? 300 : isHighlighted ? 250 : 70
            return (
              <React.Fragment key={location.id}>
                <Polyline
                  path={path}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={12}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex}
                />
                <Polyline
                  path={path}
                  strokeColor={isSelected ? "#ef4444" : isHighlighted ? "#fca5a5" : "#10b981"}
                  strokeOpacity={1}
                  strokeWeight={2}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {facilityPolygons.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const isSelected = activeSelectedId === location.id
            const zIndex = isSelected ? 300 : isHighlighted ? 250 : 80
            return (
              <React.Fragment key={location.id}>
                <Polygon
                  paths={paths}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={12}
                  fillColor="transparent"
                  fillOpacity={0}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex}
                />
                <Polygon
                  paths={paths}
                  strokeColor={isSelected ? "#ef4444" : isHighlighted ? "#ef4444" : "#f97316"}
                  strokeOpacity={1}
                  strokeWeight={2}
                  fillColor={isSelected ? "#ef4444" : isHighlighted ? "#60a5fa" : "#fed7aa"}
                  fillOpacity={isSelected ? 0.15 : isHighlighted ? 0.15 : 0.4}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {facilityPolylines.map((location) => {
            const path = convertCoordinates(location.path_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const isSelected = activeSelectedId === location.id
            const zIndex = isSelected ? 300 : isHighlighted ? 250 : 80
            return (
              <React.Fragment key={location.id}>
                <Polyline
                  path={path}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={12}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex}
                />
                <Polyline
                  path={path}
                  strokeColor={isSelected ? "#ef4444" : isHighlighted ? "#fca5a5" : "#f97316"}
                  strokeOpacity={1}
                  strokeWeight={2}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {walkingPaths.map((location) => {
            const path = convertCoordinates(location.path_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const isSelected = activeSelectedId === location.id
            const zIndex = isSelected ? 300 : isHighlighted ? 250 : 90
            return (
              <React.Fragment key={location.id}>
                <Polyline
                  path={path}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={12}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex}
                />
                <Polyline
                  path={path}
                  strokeColor={isSelected ? "#ef4444" : isHighlighted ? "#fca5a5" : "#84cc16"}
                  strokeOpacity={1}
                  strokeWeight={2}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {facilityMarkers.map((location) => {
            const isHighlighted = activeHighlightId === location.id
            const isSelected = activeSelectedId === location.id
            return (
              <Marker
                key={location.id}
                position={location.coordinates!}
                onClick={() => handleLocationClick(location)}
                zIndex={isSelected ? 300 : isHighlighted ? 250 : 100}
              />
            )
          })}

          {markerPosition && (
            <Marker
              position={markerPosition}
              zIndex={400}
              icon={{
                url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='48' viewBox='0 0 32 48'%3E%3Cpath fill='%239333ea' stroke='%23ffffff' strokeWidth='2' d='M16 0C8.8 0 3 5.8 3 13c0 8.5 13 35 13 35s13-26.5 13-35c0-7.2-5.8-13-13-13zm0 18c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z'/%3E%3C/svg%3E",
                scaledSize: { width: 32, height: 48 },
                anchor: { x: 16, y: 48 },
              }}
            />
          )}

          {drawingMode === "polygon" && polygonPoints.length === 1 && (
            <Marker
              position={polygonPoints[0]}
              zIndex={400}
              icon={{
                path: "M 0,0 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0",
                scale: 1,
                fillColor: "#9333ea",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
            />
          )}

          {drawingMode === "polygon" && polygonPoints.length === 2 && (
            <>
              {polygonPoints.map((point, index) => (
                <Marker
                  key={index}
                  position={point}
                  zIndex={400}
                  icon={{
                    path: "M 0,0 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0",
                    scale: 1,
                    fillColor: "#9333ea",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                  }}
                />
              ))}
              <Polyline
                path={polygonPoints}
                strokeColor="#9333ea"
                strokeOpacity={0.8}
                strokeWeight={2}
                clickable={false}
                zIndex={400}
              />
            </>
          )}

          {drawingMode === "polygon" && polygonPoints.length >= 3 && (
            <Polygon
              paths={polygonPoints}
              strokeColor="#9333ea"
              strokeOpacity={0.8}
              strokeWeight={2}
              fillColor="#9333ea"
              fillOpacity={0.3}
              clickable={false}
              zIndex={400}
            />
          )}

          {!drawingMode && drawnType === "pin" && drawnCoordinates && (
            <Marker
              position={drawnCoordinates}
              zIndex={350}
              icon={{
                url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='48' viewBox='0 0 32 48'%3E%3Cpath fill='%239333ea' stroke='%23ffffff' strokeWidth='2' d='M16 0C8.8 0 3 5.8 3 13c0 8.5 13 35 13 35s13-26.5 13-35c0-7.2-5.8-13-13-13zm0 18c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z'/%3E%3C/svg%3E",
                scaledSize: { width: 32, height: 48 },
                anchor: { x: 16, y: 48 },
              }}
            />
          )}

          {!drawingMode && drawnType === "polygon" && drawnPath && drawnPath.length >= 3 && (
            <Polygon
              paths={drawnPath}
              strokeColor="#9333ea"
              strokeOpacity={0.8}
              strokeWeight={2}
              fillColor="#9333ea"
              fillOpacity={0.3}
              clickable={false}
              zIndex={350}
            />
          )}

          {userLocation && (
            <Marker position={userLocation} title="Your Location" zIndex={300}>
              <div className="relative flex items-center justify-center">
                {/* Blue dot with white border */}
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                {/* Pulsing ring animation */}
                <div className="absolute w-8 h-8 bg-blue-400 rounded-full opacity-30 animate-ping" />
              </div>
            </Marker>
          )}
        </Map>
      </APIProvider>

      {selectedLocation && (
        <div className="absolute top-4 right-4 z-20 max-w-sm">
          <LocationInfoCard location={selectedLocation} onClose={() => setSelectedLocation(null)} minimal={minimal} />
        </div>
      )}

      {drawingMode && (
        <div className="absolute left-3 bottom-3 flex flex-col gap-2 z-10">
          <Button
            variant="default"
            size="icon"
            className="h-10 w-10 shadow-lg bg-purple-600 hover:bg-purple-700"
            title="Drop pin mode active - Click anywhere or click a public location"
          >
            <MapPin className="h-5 w-5" />
          </Button>
          <div className="h-px bg-border" />
          <Button
            variant="destructive"
            size="icon"
            onClick={clearDrawing}
            className="h-10 w-10 shadow-lg"
            title="Clear Pin"
            disabled={!markerPosition}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      )}

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

      {isAdmin && (
        <div className="absolute bottom-3 left-3 z-10">
          <Button asChild size="icon" className="shadow-lg h-10 w-10">
            <Link href={`/t/${tenantId}/admin/map/locations/create`}>
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      )}

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
            <DropdownMenuCheckboxItem checked={showBoundary} onCheckedChange={setShowBoundary}>
              Boundary
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={showNeighborhoods} onCheckedChange={setShowNeighborhoods}>
              Neighborhoods
            </DropdownMenuCheckboxItem>
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

      <div className="absolute bottom-3 right-3 z-10">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleLocateMe}
          className="h-10 w-10 shadow-lg"
          title="Locate Me"
          disabled={locatingUser}
        >
          <Locate className={`h-5 w-5 ${locatingUser ? "animate-pulse" : ""}`} />
        </Button>
      </div>
    </div>
  )
})
