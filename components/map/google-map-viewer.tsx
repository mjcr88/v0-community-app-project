"use client"

import { useState, useEffect } from "react"
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
import { createBrowserClient } from "@/utils/supabase-client"

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
}

interface GoogleMapViewerProps {
  tenantSlug: string
  initialLocations: Location[]
  mapCenter?: { lat: number; lng: number } | null
  mapZoom?: number
  isAdmin?: boolean
  highlightLocationId?: string
}

export function GoogleMapViewer({
  tenantSlug,
  initialLocations,
  mapCenter,
  mapZoom = 15,
  isAdmin = false,
  highlightLocationId,
}: GoogleMapViewerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [highlightedLocationId, setHighlightedLocationId] = useState<string | undefined>(highlightLocationId)
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

  console.log("[v0] GoogleMapViewer received locations:", initialLocations.length)
  console.log(
    "[v0] Location types:",
    initialLocations.map((l) => l.type),
  )
  console.log("[v0] GoogleMapViewer highlightLocationId:", highlightLocationId)

  useEffect(() => {
    if (highlightLocationId) {
      setHighlightedLocationId(highlightLocationId)
      const location = initialLocations.find((loc) => loc.id === highlightLocationId)
      if (location) {
        console.log("[v0] Auto-selecting highlighted location:", location.name)
        setSelectedLocation(location)

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
  }, []) // Only run once on mount

  useEffect(() => {
    const loadTenantBoundary = async () => {
      const supabase = createBrowserClient()
      const { data: tenant } = await supabase
        .from("tenants")
        .select("map_boundary_coordinates, id")
        .eq("slug", tenantSlug)
        .single()

      console.log("[v0] Tenant boundary data:", tenant)
      console.log("[v0] Tenant boundary coordinates:", tenant?.map_boundary_coordinates)

      if (tenant?.map_boundary_coordinates) {
        setTenantBoundary(tenant.map_boundary_coordinates as Array<{ lat: number; lng: number }>)
        console.log("[v0] Tenant boundary set:", tenant.map_boundary_coordinates)
      } else {
        console.log("[v0] No tenant boundary found")
      }

      const { data: boundaryLocations } = await supabase
        .from("locations")
        .select("*")
        .eq("type", "boundary")
        .eq("tenant_id", tenant?.id || "")

      console.log("[v0] Boundary locations from table:", boundaryLocations?.length || 0)
      if (boundaryLocations && boundaryLocations.length > 0) {
        console.log("[v0] First boundary location:", {
          id: boundaryLocations[0].id,
          name: boundaryLocations[0].name,
          hasCoordinates: !!boundaryLocations[0].boundary_coordinates,
          coordinateCount: boundaryLocations[0].boundary_coordinates?.length || 0,
          firstCoord: boundaryLocations[0].boundary_coordinates?.[0],
        })
      }
      setBoundaryLocationsFromTable(boundaryLocations)
    }

    loadTenantBoundary()
  }, [tenantSlug])

  const facilityMarkers = initialLocations.filter((loc) => showFacilities && loc.type === "facility" && loc.coordinates)
  const facilityPolygons = initialLocations.filter(
    (loc) => showFacilities && loc.type === "facility" && loc.boundary_coordinates,
  )
  const facilityPolylines = initialLocations.filter(
    (loc) => showFacilities && loc.type === "facility" && loc.path_coordinates,
  )
  const lotPolygons = initialLocations.filter((loc) => showLots && loc.type === "lot" && loc.boundary_coordinates)
  const lotPolylines = initialLocations.filter((loc) => showLots && loc.type === "lot" && loc.path_coordinates)
  const walkingPaths = initialLocations.filter(
    (loc) => showWalkingPaths && loc.type === "walking_path" && loc.path_coordinates,
  )
  const neighborhoodPolygons = initialLocations.filter(
    (loc) => showNeighborhoods && loc.type === "neighborhood" && loc.boundary_coordinates,
  )
  const boundaryLocations = initialLocations.filter(
    (loc) => showBoundary && loc.type === "boundary" && loc.boundary_coordinates,
  )
  const publicStreetPolylines = initialLocations.filter((loc) => loc.type === "public_street" && loc.path_coordinates)
  const publicStreetPolygons = initialLocations.filter(
    (loc) => loc.type === "public_street" && loc.boundary_coordinates,
  )

  console.log("[v0] Filtered neighborhoods:", neighborhoodPolygons.length)

  const handleMapClick = () => {
    console.log("[v0] Map clicked, clearing selection")
    console.log("[v0] Previous highlightedLocationId:", highlightedLocationId)
    setHighlightedLocationId(undefined)
    setSelectedLocation(null)
  }

  const handleLocationClick = (location: Location) => {
    console.log("[v0] Location clicked:", location.name, location.id)
    console.log("[v0] Previous highlightedLocationId:", highlightedLocationId)
    setHighlightedLocationId(location.id)
    setSelectedLocation(location)
  }

  const convertCoordinates = (coords: [number, number][]) => {
    return coords.map((coord) => ({
      lat: coord[0],
      lng: coord[1],
    }))
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
          zoomControl={false}
          minZoom={10}
          maxZoom={22}
          restriction={undefined}
          onCenterChanged={(e) => setCenter(e.detail.center)}
          onZoomChanged={(e) => {
            console.log("[v0] Zoom changed to:", e.detail.zoom)
            setZoom(e.detail.zoom)
          }}
          onClick={handleMapClick}
        >
          {showBoundary && tenantBoundary && (
            <Polygon
              paths={convertCoordinates(tenantBoundary as any)}
              strokeColor="#ffffff"
              strokeOpacity={0.8}
              strokeWeight={2}
              fillColor="#ffffff"
              fillOpacity={0.15}
              clickable={false}
              zIndex={1}
            />
          )}

          {boundaryLocations.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            console.log("[v0] Rendering boundary location:", location.id, "with", paths.length, "coordinate pairs")
            const isHighlighted = highlightedLocationId === location.id
            const zIndex = isHighlighted ? 200 : 1
            return (
              <Polygon
                key={location.id}
                paths={paths}
                strokeColor={isHighlighted ? "#ef4444" : "#ffffff"}
                strokeOpacity={isHighlighted ? 1 : 0.8}
                strokeWeight={isHighlighted ? 3 : 2}
                fillColor={isHighlighted ? "#60a5fa" : "#ffffff"}
                fillOpacity={isHighlighted ? 0.4 : 0.15}
                onClick={() => {
                  console.log("[v0] Boundary polygon clicked:", location.name)
                  handleLocationClick(location)
                }}
                zIndex={zIndex}
              />
            )
          })}

          {boundaryLocationsFromTable?.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = highlightedLocationId === location.id
            const zIndex = isHighlighted ? 200 : 1
            return (
              <Polygon
                key={location.id}
                paths={paths}
                strokeColor={isHighlighted ? "#ef4444" : "#000000"}
                strokeOpacity={isHighlighted ? 1 : 0.8}
                strokeWeight={isHighlighted ? 3 : 2}
                fillColor={isHighlighted ? "#60a5fa" : "#000000"}
                fillOpacity={isHighlighted ? 0.4 : 0.15}
                onClick={() => {
                  console.log("[v0] Boundary polygon from table clicked:", location.name)
                  handleLocationClick(location)
                }}
                zIndex={zIndex}
              />
            )
          })}

          {neighborhoodPolygons.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = highlightedLocationId === location.id
            const zIndex = isHighlighted ? 200 : 8
            return (
              <Polygon
                key={location.id}
                paths={paths}
                strokeColor={isHighlighted ? "#ef4444" : "#a855f7"}
                strokeOpacity={isHighlighted ? 1 : 0.7}
                strokeWeight={isHighlighted ? 3 : 2}
                fillColor={isHighlighted ? "#60a5fa" : "#c084fc"}
                fillOpacity={isHighlighted ? 0.4 : 0.25}
                onClick={() => {
                  console.log("[v0] Neighborhood polygon clicked:", location.name)
                  handleLocationClick(location)
                }}
                zIndex={zIndex}
              />
            )
          })}

          {publicStreetPolylines.map((location) => {
            const path = convertCoordinates(location.path_coordinates!)
            const isHighlighted = highlightedLocationId === location.id
            const zIndex = isHighlighted ? 200 : 15
            return (
              <Polyline
                key={location.id}
                path={path}
                strokeColor={isHighlighted ? "#ef4444" : "#fbbf24"}
                strokeOpacity={isHighlighted ? 1 : 0.95}
                strokeWeight={isHighlighted ? 4 : 2}
                onClick={() => {
                  console.log("[v0] Public street polyline clicked:", location.name)
                  handleLocationClick(location)
                }}
                zIndex={zIndex}
              />
            )
          })}

          {publicStreetPolygons.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = highlightedLocationId === location.id
            const zIndex = isHighlighted ? 200 : 15
            return (
              <Polygon
                key={location.id}
                paths={paths}
                strokeColor={isHighlighted ? "#ef4444" : "#fbbf24"}
                strokeOpacity={isHighlighted ? 1 : 0.95}
                strokeWeight={isHighlighted ? 3 : 2}
                fillColor={isHighlighted ? "#60a5fa" : "#d3d3d3"}
                fillOpacity={isHighlighted ? 0.4 : 0.25}
                onClick={() => {
                  console.log("[v0] Public street polygon clicked:", location.name)
                  handleLocationClick(location)
                }}
                zIndex={zIndex}
              />
            )
          })}

          {lotPolygons.map((location) => {
            const paths = convertCoordinates(location.boundary_coordinates!)
            const isHighlighted = highlightedLocationId === location.id
            const zIndex = isHighlighted ? 200 : 10
            return (
              <Polygon
                key={location.id}
                paths={paths}
                strokeColor={isHighlighted ? "#ef4444" : "#60a5fa"}
                strokeOpacity={isHighlighted ? 1 : 0.7}
                strokeWeight={isHighlighted ? 3 : 2}
                fillColor="#60a5fa"
                fillOpacity={isHighlighted ? 0.4 : 0.15}
                onClick={() => {
                  console.log("[v0] Lot polygon clicked:", location.name)
                  handleLocationClick(location)
                }}
                zIndex={zIndex}
              />
            )
          })}

          {lotPolylines.map((location) => {
            const path = convertCoordinates(location.path_coordinates!)
            const isHighlighted = highlightedLocationId === location.id
            const zIndex = isHighlighted ? 200 : 10
            return (
              <Polyline
                key={location.id}
                path={path}
                strokeColor={isHighlighted ? "#ef4444" : "#60a5fa"}
                strokeOpacity={isHighlighted ? 1 : 0.8}
                strokeWeight={isHighlighted ? 6 : 4}
                onClick={() => {
                  console.log("[v0] Lot polyline clicked:", location.name)
                  handleLocationClick(location)
                }}
                zIndex={zIndex}
              />
            )
          })}

          {facilityMarkers.map((location) => {
            const isHighlighted = highlightedLocationId === location.id
            const zIndex = isHighlighted ? 200 : 20
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
            const isHighlighted = highlightedLocationId === location.id
            const zIndex = isHighlighted ? 200 : 20
            return (
              <Polygon
                key={location.id}
                paths={paths}
                strokeColor={isHighlighted ? "#ef4444" : "#fb923c"}
                strokeOpacity={isHighlighted ? 1 : 0.7}
                strokeWeight={isHighlighted ? 3 : 2}
                fillColor={isHighlighted ? "#60a5fa" : "#fdba74"}
                fillOpacity={isHighlighted ? 0.4 : 0.25}
                onClick={() => {
                  console.log("[v0] Facility polygon clicked:", location.name)
                  handleLocationClick(location)
                }}
                zIndex={zIndex}
              />
            )
          })}

          {facilityPolylines.map((location) => {
            const path = convertCoordinates(location.path_coordinates!)
            const isHighlighted = highlightedLocationId === location.id
            const zIndex = isHighlighted ? 200 : 20
            return (
              <Polyline
                key={location.id}
                path={path}
                strokeColor={isHighlighted ? "#ef4444" : "#fb923c"}
                strokeOpacity={isHighlighted ? 1 : 0.8}
                strokeWeight={isHighlighted ? 6 : 4}
                onClick={() => {
                  console.log("[v0] Facility polyline clicked:", location.name)
                  handleLocationClick(location)
                }}
                zIndex={zIndex}
              />
            )
          })}

          {walkingPaths.map((location) => {
            const path = convertCoordinates(location.path_coordinates!)
            const isHighlighted = highlightedLocationId === location.id
            const zIndex = isHighlighted ? 200 : 25
            return (
              <Polyline
                key={location.id}
                path={path}
                strokeColor={isHighlighted ? "#ef4444" : "#3b82f6"}
                strokeOpacity={isHighlighted ? 1 : 0.8}
                strokeWeight={isHighlighted ? 4 : 2}
                onClick={() => {
                  console.log("[v0] Walking path clicked:", location.name)
                  handleLocationClick(location)
                }}
                zIndex={zIndex}
              />
            )
          })}
        </Map>
      </APIProvider>

      {selectedLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <LocationInfoCard location={selectedLocation} onClose={() => setSelectedLocation(null)} />
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
            <Link href={`/t/${tenantSlug}/admin/map/locations/create`}>
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
}
