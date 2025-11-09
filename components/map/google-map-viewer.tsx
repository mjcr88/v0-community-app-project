"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { Plus, Locate, Layers, Filter } from "lucide-react"
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
  tenantId: string
  mapCenter?: { lat: number; lng: number } | null
  mapZoom?: number
  isAdmin?: boolean
  highlightLocationId?: string
  minimal?: boolean
}

export const GoogleMapViewer = React.memo(function GoogleMapViewer({
  locations: initialLocations = [], // Add default empty array to prevent undefined
  tenantId,
  mapCenter,
  mapZoom = 15,
  isAdmin = false,
  highlightLocationId,
  minimal = false,
}: GoogleMapViewerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [initialHighlightId] = useState<string | undefined>(highlightLocationId)
  const [dynamicHighlightId, setDynamicHighlightId] = useState<string | undefined>(undefined)
  const [center, setCenter] = useState<{ lat: number; lng: number }>(mapCenter || { lat: 9.9567, lng: -84.5333 })
  const [zoom, setZoom] = useState(mapZoom)
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">("satellite")

  const [showFacilities, setShowFacilities] = useState(true)
  const [showLots, setShowLots] = useState(true)
  const [showWalkingPaths, setShowWalkingPaths] = useState(true)
  const [showNeighborhoods, setShowNeighborhoods] = useState(true)
  const [showBoundary, setShowBoundary] = useState(true)
  const [tenantBoundary, setTenantBoundary] = useState<Array<{ lat: number; lng: number }> | null>(null)
  const [boundaryLocationsFromTable, setBoundaryLocationsFromTable] = useState<Location[] | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  const activeHighlightId = dynamicHighlightId || initialHighlightId

  useEffect(() => {
    console.log("[v0] GoogleMapViewer mounted with:", {
      locationsCount: initialLocations.length,
      highlightLocationId,
      minimal,
    })
  }, [])

  useEffect(() => {
    if (initialHighlightId) {
      const location = initialLocations.find((loc) => loc.id === initialHighlightId)
      if (location) {
        const hasLotId = location.type === "lot" && location.lot_id
        console.log("[v0] Auto-selecting initial highlight:", location.name, "has lot_id:", hasLotId)

        if (!minimal && hasLotId) {
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

  const handleMapClick = useCallback(() => {
    setDynamicHighlightId(undefined)
    setSelectedLocation(null)
  }, [])

  const handleLocationClick = useCallback((location: Location) => {
    console.log("[v0] Location clicked:", location.name, location.id)
    setDynamicHighlightId(location.id)
    setSelectedLocation(location)
  }, [])

  const convertCoordinates = useCallback((coords: [number, number][]) => {
    return coords.map((coord) => ({
      lat: coord[0],
      lng: coord[1],
    }))
  }, [])

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
          zoomControl={false}
          minZoom={10}
          maxZoom={22}
          restriction={undefined}
          mapId={undefined}
          onCenterChanged={(e) => setCenter(e.detail.center)}
          onZoomChanged={(e) => setZoom(e.detail.zoom)}
          onClick={handleMapClick}
        >
          {/* Instead, we'll add a subtle LIGHT overlay inside the boundary to make it brighter */}
          {showBoundary && tenantBoundary && (
            <Polygon
              paths={convertCoordinates(tenantBoundary as any)}
              strokeColor="#3b82f6"
              strokeOpacity={0.8}
              strokeWeight={2}
              fillColor="#ffffff"
              fillOpacity={0.1}
              clickable={false}
              zIndex={1}
            />
          )}

          {boundaryLocations.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const zIndex = isHighlighted ? 200 : 2
            return (
              <Polygon
                key={`${location.id}-boundary`}
                paths={paths}
                strokeColor={isHighlighted ? "#ef4444" : "#3b82f6"}
                strokeOpacity={isHighlighted ? 1 : 0.8}
                strokeWeight={isHighlighted ? 3 : 2}
                fillColor="transparent"
                fillOpacity={0}
                clickable={false}
                zIndex={zIndex}
              />
            )
          })}

          {boundaryLocationsFromTable?.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const zIndex = isHighlighted ? 200 : 2
            return (
              <Polygon
                key={`${location.id}-boundary`}
                paths={paths}
                strokeColor={isHighlighted ? "#ef4444" : "#3b82f6"}
                strokeOpacity={isHighlighted ? 1 : 0.8}
                strokeWeight={isHighlighted ? 3 : 2}
                fillColor="transparent"
                fillOpacity={0}
                clickable={false}
                zIndex={zIndex}
              />
            )
          })}

          {neighborhoodPolygons.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const zIndex = isHighlighted ? 200 : 50
            return (
              <React.Fragment key={location.id}>
                <Polygon
                  paths={paths}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={8}
                  fillColor="transparent"
                  fillOpacity={0}
                  onClick={() => {
                    console.log("[v0] Neighborhood polygon clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex}
                />
                <Polygon
                  paths={paths}
                  strokeColor={isHighlighted ? "#ef4444" : "#c084fc"}
                  strokeOpacity={1}
                  strokeWeight={isHighlighted ? 3 : 1}
                  fillColor={isHighlighted ? "#60a5fa" : "#e9d5ff"}
                  fillOpacity={isHighlighted ? 0.6 : 0.4}
                  onClick={() => {
                    console.log("[v0] Neighborhood polygon clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {publicStreetPolylines.map((location) => {
            const path = convertCoordinates(location.path_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const zIndex = isHighlighted ? 200 : 60
            return (
              <React.Fragment key={location.id}>
                <Polyline
                  path={path}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={8}
                  onClick={() => {
                    console.log("[v0] Public street polyline clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex}
                />
                <Polyline
                  path={path}
                  strokeColor={isHighlighted ? "#ef4444" : "#fbbf24"}
                  strokeOpacity={1}
                  strokeWeight={isHighlighted ? 4 : 1}
                  onClick={() => {
                    console.log("[v0] Public street polyline clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {publicStreetPolygons.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const zIndex = isHighlighted ? 200 : 60
            return (
              <React.Fragment key={location.id}>
                <Polygon
                  paths={paths}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={8}
                  fillColor="transparent"
                  fillOpacity={0}
                  onClick={() => {
                    console.log("[v0] Public street polygon clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex}
                />
                <Polygon
                  paths={paths}
                  strokeColor={isHighlighted ? "#ef4444" : "#fbbf24"}
                  strokeOpacity={1}
                  strokeWeight={isHighlighted ? 3 : 1}
                  fillColor={isHighlighted ? "#60a5fa" : "#fef3c7"}
                  fillOpacity={isHighlighted ? 0.6 : 0.4}
                  onClick={() => {
                    console.log("[v0] Public street polygon clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {lotPolygons.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const zIndex = isHighlighted ? 200 : 70
            return (
              <React.Fragment key={location.id}>
                <Polygon
                  paths={paths}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={8}
                  fillColor="transparent"
                  fillOpacity={0}
                  onClick={() => {
                    console.log("[v0] Lot polygon clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex}
                />
                <Polygon
                  paths={paths}
                  strokeColor={isHighlighted ? "#ef4444" : "#60a5fa"}
                  strokeOpacity={1}
                  strokeWeight={isHighlighted ? 3 : 1}
                  fillColor={isHighlighted ? "#60a5fa" : "#bfdbfe"}
                  fillOpacity={isHighlighted ? 0.6 : 0.4}
                  onClick={() => {
                    console.log("[v0] Lot polygon clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {lotPolylines.map((location) => {
            const path = convertCoordinates(location.path_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const zIndex = isHighlighted ? 200 : 70
            return (
              <React.Fragment key={location.id}>
                <Polyline
                  path={path}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={8}
                  onClick={() => {
                    console.log("[v0] Lot polyline clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex}
                />
                <Polyline
                  path={path}
                  strokeColor={isHighlighted ? "#ef4444" : "#60a5fa"}
                  strokeOpacity={1}
                  strokeWeight={isHighlighted ? 4 : 1}
                  onClick={() => {
                    console.log("[v0] Lot polyline clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {facilityMarkers.map((location) => {
            const isHighlighted = activeHighlightId === location.id
            const zIndex = isHighlighted ? 200 : 80
            return (
              <Marker
                key={location.id}
                position={location.coordinates!}
                onClick={() => {
                  console.log("[v0] Facility marker clicked:", location.name)
                  handleLocationClick(location)
                }}
                zIndex={zIndex}
              />
            )
          })}

          {facilityPolygons.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const zIndex = isHighlighted ? 200 : 80
            return (
              <React.Fragment key={location.id}>
                <Polygon
                  paths={paths}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={8}
                  fillColor="transparent"
                  fillOpacity={0}
                  onClick={() => {
                    console.log("[v0] Facility polygon clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex}
                />
                <Polygon
                  paths={paths}
                  strokeColor={isHighlighted ? "#ef4444" : "#fb923c"}
                  strokeOpacity={1}
                  strokeWeight={isHighlighted ? 3 : 1}
                  fillColor={isHighlighted ? "#60a5fa" : "#fed7aa"}
                  fillOpacity={isHighlighted ? 0.6 : 0.5}
                  onClick={() => {
                    console.log("[v0] Facility polygon clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {facilityPolylines.map((location) => {
            const path = convertCoordinates(location.path_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const zIndex = isHighlighted ? 200 : 80
            return (
              <React.Fragment key={location.id}>
                <Polyline
                  path={path}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={8}
                  onClick={() => {
                    console.log("[v0] Facility polyline clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex}
                />
                <Polyline
                  path={path}
                  strokeColor={isHighlighted ? "#ef4444" : "#fb923c"}
                  strokeOpacity={1}
                  strokeWeight={isHighlighted ? 4 : 1}
                  onClick={() => {
                    console.log("[v0] Facility polyline clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}

          {walkingPaths.map((location) => {
            const path = convertCoordinates(location.path_coordinates!)
            const isHighlighted = activeHighlightId === location.id
            const zIndex = isHighlighted ? 200 : 90
            return (
              <React.Fragment key={location.id}>
                <Polyline
                  path={path}
                  strokeColor="transparent"
                  strokeOpacity={0}
                  strokeWeight={8}
                  onClick={() => {
                    console.log("[v0] Walking path clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex}
                />
                <Polyline
                  path={path}
                  strokeColor={isHighlighted ? "#ef4444" : "#3b82f6"}
                  strokeOpacity={1}
                  strokeWeight={isHighlighted ? 4 : 1}
                  onClick={() => {
                    console.log("[v0] Walking path clicked:", location.name)
                    handleLocationClick(location)
                  }}
                  zIndex={zIndex + 1}
                />
              </React.Fragment>
            )
          })}
        </Map>
      </APIProvider>

      {selectedLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <LocationInfoCard location={selectedLocation} onClose={() => setSelectedLocation(null)} minimal={minimal} />
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
        <Button variant="secondary" size="icon" onClick={() => {}} className="h-10 w-10 shadow-lg" title="Locate Me">
          <Locate className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
})
