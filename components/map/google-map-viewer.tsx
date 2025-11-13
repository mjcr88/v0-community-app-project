"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { APIProvider, Map, Marker, AdvancedMarker } from "@vis.gl/react-google-maps"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"
import { createBrowserClient } from "@/lib/supabase/client"
import React from "react"
import { LocationInfoCard } from "./location-info-card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { MapPin, Trash2, Filter, Layers, Locate, Plus } from 'lucide-react'
import { getLocationEventCount } from "@/app/actions/events"
import { CheckInDetailModal } from "@/components/check-ins/check-in-detail-modal" // Declare the CheckInDetailModal variable

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
  tenantId?: string
  tenantSlug?: string
  checkIns?: any[]
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
    type?: "marker" | "polygon" | null
    path?: Array<{ lat: number; lng: number }> | null
  }) => void
  drawnCoordinates?: { lat: number; lng: number } | null
  drawnPath?: Array<{ lat: number; lng: number }> | null
  drawnType?: "marker" | "polygon" | null
  enableClickablePlaces?: boolean
}

function isPointInPolygon(point: { lat: number; lng: number }, polygon: Array<[number, number]>): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1],
      yi = polygon[i][0]
    const xj = polygon[j][1],
      yj = polygon[j][0]

    const intersect = yi > point.lat !== yj > point.lat && point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function distributePointsInBoundary(
  boundary: Array<[number, number]>,
  count: number,
  checkInIds: string[],
): Array<{ lat: number; lng: number }> {
  if (count === 1) {
    // Single check-in: use center
    const lats = boundary.map((c) => c[0])
    const lngs = boundary.map((c) => c[1])
    return [
      {
        lat: lats.reduce((a, b) => a + b, 0) / lats.length,
        lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
      },
    ]
  }

  // Calculate bounding box
  const lats = boundary.map((c) => c[0])
  const lngs = boundary.map((c) => c[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  const positions: Array<{ lat: number; lng: number }> = []

  // Generate deterministic grid points inside polygon
  const gridSize = Math.ceil(Math.sqrt(count * 2)) // Oversample to ensure enough valid points
  const latStep = (maxLat - minLat) / (gridSize + 1)
  const lngStep = (maxLng - minLng) / (gridSize + 1)

  const candidatePoints: Array<{ lat: number; lng: number; hash: number }> = []

  // Generate grid of candidate points
  for (let i = 1; i <= gridSize; i++) {
    for (let j = 1; j <= gridSize; j++) {
      const lat = minLat + i * latStep
      const lng = minLng + j * lngStep
      const point = { lat, lng }

      if (isPointInPolygon(point, boundary)) {
        // Create deterministic hash for this grid position
        const hash = i * 1000 + j
        candidatePoints.push({ ...point, hash })
      }
    }
  }

  if (candidatePoints.length === 0) {
    // Fallback: use center if no valid points found
    console.warn("[v0] No valid points found inside boundary, using center")
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
    return Array(count).fill({ lat: centerLat, lng: centerLng })
  }

  // Sort candidate points by hash for consistency
  candidatePoints.sort((a, b) => a.hash - b.hash)

  // Assign each check-in to a position based on its ID hash
  checkInIds.forEach((checkInId, index) => {
    // Create deterministic index from check-in ID
    const idHash = checkInId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const pointIndex = (idHash + index) % candidatePoints.length

    positions.push({
      lat: candidatePoints[pointIndex].lat,
      lng: candidatePoints[pointIndex].lng,
    })
  })

  return positions
}

function distributePointsAlongPath(
  path: Array<[number, number]>,
  count: number,
  checkInIds: string[],
): Array<{ lat: number; lng: number }> {
  if (count === 1 || path.length < 2) {
    // Single check-in or short path: use midpoint
    const midIndex = Math.floor(path.length / 2)
    return [{ lat: path[midIndex][0], lng: path[midIndex][1] }]
  }

  const positions: Array<{ lat: number; lng: number }> = []

  // Calculate evenly spaced intervals along the path
  const step = Math.max(1, Math.floor(path.length / count))

  checkInIds.forEach((checkInId, index) => {
    // Use index primarily for spacing, add ID hash for minor variation
    const idHash = checkInId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const baseIndex = (index * step) % path.length
    const offset = (idHash % 3) - 1 // -1, 0, or 1 for slight variation
    const pathIndex = Math.max(0, Math.min(path.length - 1, baseIndex + offset))

    const position = {
      lat: path[pathIndex][0],
      lng: path[pathIndex][1],
    }

    positions.push(position)
    console.log(`[v0] Check-in ${index + 1}/${count} assigned to path point ${pathIndex}:`, position)
  })

  return positions
}

export const GoogleMapViewer = React.memo(function GoogleMapViewer({
  locations: initialLocations = [],
  tenantId, // Now optional
  tenantSlug, // Destructure tenantSlug prop
  checkIns: initialCheckIns = [], // Destructure checkIns with default empty array
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
  enableClickablePlaces = false,
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

  const [checkIns, setCheckIns] = useState<any[]>([])
  const [loadingCheckIns, setLoadingCheckIns] = useState(false)

  // Fetch check-ins on mount (following events pattern)
  useEffect(() => {
    if (!tenantId) {
      console.log("[v0] No tenantId provided, skipping check-ins load")
      return
    }

    const loadCheckIns = async () => {
      try {
        console.log("[v0] Loading check-ins client-side for tenant:", tenantId)
        const supabase = createBrowserClient()

        // Calculate time 8 hours ago (max check-in duration)
        const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()

        const { data, error } = await supabase
          .from("check_ins")
          .select(
            `
            *,
            created_by_user:users!created_by(id, first_name, last_name, profile_picture_url),
            location:locations!location_id(id, name, coordinates, boundary_coordinates, path_coordinates)
          `,
          )
          .eq("tenant_id", tenantId)
          .eq("status", "active")
          .gte("start_time", eightHoursAgo)
          .order("start_time", { ascending: false })

        if (error) {
          console.error("[v0] Error loading check-ins:", error)
          return
        }

        if (!data) {
          console.log("[v0] No check-ins data returned")
          setCheckIns([])
          return
        }

        // Filter expired check-ins client-side (calculating: start_time + duration_minutes < NOW())
        const now = new Date()
        const activeCheckIns = data.filter((checkIn) => {
          const expiresAt = new Date(checkIn.start_time)
          expiresAt.setMinutes(expiresAt.getMinutes() + checkIn.duration_minutes)
          return expiresAt > now
        })

        console.log("[v0] Check-ins loaded successfully:", {
          count: activeCheckIns.length,
          sample: activeCheckIns[0]
            ? {
                id: activeCheckIns[0].id,
                title: activeCheckIns[0].title,
                location_type: activeCheckIns[0].location_type,
                has_location: !!activeCheckIns[0].location,
                has_creator: !!activeCheckIns[0].created_by_user,
              }
            : null,
        })

        setCheckIns(activeCheckIns)
      } catch (error) {
        console.error("[v0] Error loading check-ins:", error)
      }
    }

    loadCheckIns()

    // This reduces client-side processing while keeping data reasonably fresh
    const interval = setInterval(loadCheckIns, 120000) // 2 minutes

    return () => clearInterval(interval)
  }, [tenantId])

  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(drawnCoordinates || null)
  const [polygonPoints, setPolygonPoints] = useState<Array<{ lat: number; lng: number }>>(drawnPath || [])

  const [mapInstance, setMapInstance] = useState<any | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID

  const activeHighlightId = dynamicHighlightId || initialHighlightId
  const activeSelectedId = selectedLocationId

  const [selectedLocationEventCount, setSelectedLocationEventCount] = useState<number | null>(null)
  const [loadingEventCount, setLoadingEventCount] = useState(false)

  const [selectedCheckIn, setSelectedCheckIn] = useState<string | null>(null) // Changed to string for checkInId
  const [checkInModalOpen, setCheckInModalOpen] = useState(false)

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
      if (!mapInstance) {
        console.error("[v0] Map instance not available")
        return
      }

      console.log("[v0] Place clicked on map:", placeId)

      if (drawingMode) {
        return
      }

      console.log("[v0] Letting Google show native place info window")
    },
    [mapInstance, drawingMode],
  )

  useEffect(() => {
    if (!mapInstance) return

    console.log(
      "[v0] Setting up place click listener, enableClickablePlaces:",
      enableClickablePlaces,
      "drawingMode:",
      drawingMode,
    )

    if (drawingMode === "marker") {
      const drawingListener = mapInstance.addListener("click", (e: any) => {
        if (e.placeId) {
          console.log("[v0] Place icon clicked in drawing mode:", e.placeId)
          e.stop() // Prevent default info window

          // Use Places service to get details
          const service = new window.google.maps.places.PlacesService(mapInstance)
          service.getDetails(
            {
              placeId: e.placeId,
              fields: ["name", "formatted_address", "geometry.location"],
            },
            (place, status) => {
              console.log("[v0] Place getDetails response - status:", status, "place:", place)

              if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                const lat = place.geometry?.location?.lat()
                const lng = place.geometry?.location?.lng()
                const name =
                  place.name ||
                  (place.formatted_address ? place.formatted_address.split(",")[0] : null) ||
                  "Custom Location"

                console.log("[v0] Extracted place data - name:", name, "lat:", lat, "lng:", lng)

                if (lat !== undefined && lng !== undefined && name) {
                  console.log("[v0] Selected place:", { name, lat, lng })
                  setMarkerPosition({ lat, lng })

                  if (typeof onDrawingComplete === "function") {
                    onDrawingComplete({
                      coordinates: { lat, lng },
                      type: "marker",
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
                }
              }
            },
          )
        }
      })

      return () => {
        console.log("[v0] Cleaning up drawing mode place listener")
        if (drawingListener) {
          window.google?.maps?.event?.removeListener(drawingListener)
        }
      }
    }

    // The native info window will show automatically due to clickableIcons: true
  }, [mapInstance, enableClickablePlaces, drawingMode, onDrawingComplete, onDrawingModeChange])

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

  useEffect(() => {
    console.log("[v0] GoogleMapViewer - initialCheckIns prop received:", {
      count: initialCheckIns.length,
      checkIns: initialCheckIns.map((c) => ({
        id: c.id,
        title: c.title,
        location_type: c.location_type,
        has_location: !!c.location,
        has_custom_coords: !!c.custom_location_coordinates,
        location_coords: c.location?.coordinates || null,
        location_boundary: c.location?.boundary_coordinates || null,
        location_path: c.location?.path_coordinates || null,
      })),
    })
  }, [initialCheckIns])

  const checkInsWithCoords = useMemo(() => {
    const activeCheckIns = checkIns

    console.log("[v0] Processing check-ins for markers:", {
      total: activeCheckIns.length,
      currentZoom: zoom,
    })

    const locationGroups = new globalThis.Map<string, any[]>()

    activeCheckIns.forEach((checkIn) => {
      const locationKey =
        checkIn.location_type === "community_location" && checkIn.location?.id
          ? checkIn.location.id
          : `custom-${checkIn.id}`

      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, [])
      }
      locationGroups.get(locationKey)!.push(checkIn)
    })

    console.log("[v0] Check-ins grouped by location:", {
      locationCount: locationGroups.size,
      groups: Array.from(locationGroups.entries()).map(([key, items]) => ({
        locationId: key,
        count: items.length,
      })),
    })

    const checkInsWithDistributedCoords: any[] = []

    locationGroups.forEach((checkIns, locationKey) => {
      if (locationKey.startsWith("custom-")) {
        // Custom location - use exact coordinates
        const checkIn = checkIns[0]
        if (checkIn.custom_location_coordinates) {
          checkInsWithDistributedCoords.push({
            ...checkIn,
            coordinates: checkIn.custom_location_coordinates,
          })
          console.log("[v0] Custom location check-in:", checkIn.title, checkIn.custom_location_coordinates)
        }
      } else {
        // Community location - distribute within boundary/path
        const location = checkIns[0].location

        if (!location) {
          console.warn("[v0] Check-in missing location data:", checkIns[0].title)
          return
        }

        let positions: Array<{ lat: number; lng: number }> = []
        const checkInIds = checkIns.map((c) => c.id)

        if (location.boundary_coordinates && location.boundary_coordinates.length >= 3) {
          // Distribute inside boundary polygon
          positions = distributePointsInBoundary(location.boundary_coordinates, checkIns.length, checkInIds)
          console.log("[v0] Distributed", checkIns.length, "check-ins in boundary:", location.name)
          positions.forEach((pos, i) => console.log(`  Position ${i}:`, pos))
        } else if (location.path_coordinates && location.path_coordinates.length >= 2) {
          // Distribute along path
          positions = distributePointsAlongPath(location.path_coordinates, checkIns.length, checkInIds)
          console.log("[v0] Distributed", checkIns.length, "check-ins along path:", location.name)
          positions.forEach((pos, i) => console.log(`  Position ${i}:`, pos))
        } else if (location.coordinates) {
          // Single point - all markers at same location (fallback)
          positions = Array(checkIns.length).fill(location.coordinates)
          console.log("[v0] Using single point for", checkIns.length, "check-ins:", location.name)
        } else {
          console.warn("[v0] Location has no coordinates:", location.name)
          return
        }

        // Assign positions to check-ins
        checkIns.forEach((checkIn, index) => {
          checkInsWithDistributedCoords.push({
            ...checkIn,
            coordinates: positions[index],
          })
        })
      }
    })

    console.log("[v0] Check-ins with distributed coordinates:", checkInsWithDistributedCoords.length)

    const CLUSTER_ZOOM_THRESHOLD = 16

    if (zoom < CLUSTER_ZOOM_THRESHOLD) {
      // Group markers by rounded coordinates (clustering for distant view)
      const precision = Math.max(3, Math.min(6, Math.floor(zoom / 3)))
      const coordsMap = new globalThis.Map<string, any[]>()

      checkInsWithDistributedCoords.forEach((checkIn) => {
        const key = `${checkIn.coordinates.lat.toFixed(precision)},${checkIn.coordinates.lng.toFixed(precision)}`
        if (!coordsMap.has(key)) {
          coordsMap.set(key, [])
        }
        coordsMap.get(key)!.push(checkIn)
      })

      const clusteredCheckIns: any[] = []
      coordsMap.forEach((group) => {
        if (group.length === 1) {
          // Single marker - no clustering needed
          clusteredCheckIns.push(group[0])
        } else {
          // Multiple markers - create a cluster marker
          const centerLat = group.reduce((sum, c) => sum + c.coordinates.lat, 0) / group.length
          const centerLng = group.reduce((sum, c) => sum + c.coordinates.lng, 0) / group.length

          clusteredCheckIns.push({
            ...group[0], // Use first check-in as base
            coordinates: { lat: centerLat, lng: centerLng },
            isCluster: true,
            clusterCount: group.length,
            clusterCheckIns: group, // Store all check-ins in cluster
          })
        }
      })

      console.log("[v0] Clustered markers at zoom", zoom, ":", {
        original: checkInsWithDistributedCoords.length,
        clustered: clusteredCheckIns.length,
      })
      return clusteredCheckIns
    } else {
      // At high zoom, show individual markers without clustering
      console.log("[v0] Individual markers (no clustering) at zoom", zoom, ":", checkInsWithDistributedCoords.length)
      return checkInsWithDistributedCoords
    }
  }, [checkIns, zoom])

  const handleMapClick = useCallback(
    (e: any) => {
      console.log("[v0] Map clicked - RAW EVENT:", {
        hasDetail: !!e.detail,
        detail: e.detail,
        hasLatLng: !!(e.detail?.latLng || e.latLng),
        drawingMode,
      })

      let lat: number | undefined
      let lng: number | undefined

      if (e.detail?.latLng) {
        lat = e.detail.latLng.lat
        lng = e.detail.latLng.lng
      } else if (e.detail?.lat && e.detail?.lng) {
        lat = e.detail.lat
        lng = e.detail.lng
      } else if (e.latLng) {
        // Try direct latLng property
        lat = typeof e.latLng.lat === "function" ? e.latLng.lat() : e.latLng.lat
        lng = typeof e.latLng.lng === "function" ? e.latLng.lng() : e.latLng.lng
      }

      console.log("[v0] Extracted coordinates:", { lat, lng })

      if (drawingMode === "marker" && lat !== undefined && lng !== undefined) {
        console.log("[v0] Dropping custom pin at:", { lat, lng })
        setMarkerPosition({ lat, lng })

        if (typeof onDrawingComplete === "function") {
          console.log("[v0] Calling onDrawingComplete with coordinates")
          onDrawingComplete({
            coordinates: { lat, lng },
            type: "marker",
            path: null,
          })
        }
      } else if (!drawingMode) {
        console.log("[v0] Map clicked - clearing selection")
        setDynamicHighlightId(undefined)
        setSelectedLocation(null)
      } else {
        console.log("[v0] Map clicked but no action taken:", {
          drawingMode,
          hasCoordinates: lat !== undefined && lng !== undefined,
        })
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
    async (location: Location) => {
      if (drawingMode) {
        console.log("[v0] Ignoring location click - drawing mode active")
        return
      }

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

      if (tenantId && location.id) {
        setLoadingEventCount(true)
        try {
          const count = await getLocationEventCount(location.id, tenantId)
          console.log("[v0] Event count for location:", location.name, "=", count)
          setSelectedLocationEventCount(count)
        } catch (error) {
          console.error("[v0] Error fetching event count:", error)
          setSelectedLocationEventCount(null)
        } finally {
          setLoadingEventCount(false)
        }
      }
    },
    [onLocationClick, showInfoCard, tenantId, drawingMode],
  )

  const handleCheckInClick = useCallback((checkIn: any) => {
    console.log("[v0] Check-in marker clicked:", checkIn.title)
    setSelectedCheckIn(checkIn.id)
    setCheckInModalOpen(true)
  }, [])

  const handleCustomMarkerClick = useCallback(() => {
    if (markerPosition) {
      console.log("[v0] Custom marker clicked, opening Google Maps")
      const url = `https://www.google.com/maps/search/?api=1&query=${markerPosition.lat},${markerPosition.lng}`
      window.open(url, "_blank")
    }
  }, [markerPosition])

  const handleCloseInfoCard = useCallback(() => {
    setSelectedLocation(null)
    setSelectedLocationEventCount(null)
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
          clickableIcons={enableClickablePlaces || drawingMode === "marker"} // Always enable clickable icons when places or drawing is enabled
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
                clickable={!drawingMode}
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
                clickable={!drawingMode}
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
                  clickable={!drawingMode}
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
                  clickable={!drawingMode}
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
                  clickable={!drawingMode}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex}
                />
                <Polyline
                  path={path}
                  strokeColor={isSelected ? "#ef4444" : isHighlighted ? "#fca5a5" : "#fbbf24"}
                  strokeOpacity={1}
                  strokeWeight={2}
                  clickable={!drawingMode}
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
                  clickable={!drawingMode}
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
                  clickable={!drawingMode}
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
                  clickable={!drawingMode}
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
                  clickable={!drawingMode}
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
                  clickable={!drawingMode}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex}
                />
                <Polyline
                  path={path}
                  strokeColor={isSelected ? "#ef4444" : isHighlighted ? "#fca5a5" : "#10b981"}
                  strokeOpacity={1}
                  strokeWeight={2}
                  clickable={!drawingMode}
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
                  clickable={!drawingMode}
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
                  clickable={!drawingMode}
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
                  clickable={!drawingMode}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex}
                />
                <Polyline
                  path={path}
                  strokeColor={isSelected ? "#ef4444" : isHighlighted ? "#fca5a5" : "#f97316"}
                  strokeOpacity={1}
                  strokeWeight={2}
                  clickable={!drawingMode}
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
                  clickable={!drawingMode}
                  onClick={() => handleLocationClick(location)}
                  zIndex={zIndex}
                />
                <Polyline
                  path={path}
                  strokeColor={isSelected ? "#ef4444" : isHighlighted ? "#fca5a5" : "#84cc16"}
                  strokeOpacity={1}
                  strokeWeight={2}
                  clickable={!drawingMode}
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

          {checkInsWithCoords.map((checkIn) => {
            if (checkIn.isCluster) {
              // Cluster marker showing count
              return (
                <AdvancedMarker
                  key={`cluster-${checkIn.id}`}
                  position={checkIn.coordinates}
                  onClick={() => {
                    // Zoom in to show individual markers
                    setCenter(checkIn.coordinates)
                    setZoom(17)
                  }}
                  zIndex={200}
                >
                  <div className="relative cursor-pointer" style={{ transform: "translateY(-100%)" }}>
                    {/* Cluster Circle */}
                    <div className="relative w-12 h-12 rounded-full border-4 border-green-500 bg-green-600 overflow-hidden shadow-lg hover:border-green-600 transition-colors flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{checkIn.clusterCount}</span>
                    </div>

                    {/* Pointer Stem */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2"
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: "8px solid transparent",
                        borderRight: "8px solid transparent",
                        borderTop: "8px solid rgb(34, 197, 94)", // green-500
                      }}
                    />
                  </div>
                </AdvancedMarker>
              )
            }

            // Individual marker
            const firstName = checkIn.created_by_user?.first_name || ""
            const lastName = checkIn.created_by_user?.last_name || ""
            const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "?"
            const hasProfilePicture = checkIn.created_by_user?.profile_picture_url

            return (
              <AdvancedMarker
                key={checkIn.id}
                position={checkIn.coordinates}
                onClick={() => handleCheckInClick(checkIn)}
                zIndex={200}
              >
                <div className="relative cursor-pointer" style={{ transform: "translateY(-100%)" }}>
                  {/* Profile Picture Circle */}
                  <div className="relative w-12 h-12 rounded-full border-4 border-green-500 bg-white overflow-hidden shadow-lg hover:border-green-600 transition-colors">
                    {hasProfilePicture ? (
                      <img
                        src={checkIn.created_by_user.profile_picture_url || "/placeholder.svg"}
                        alt={checkIn.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white text-green-600 font-bold text-lg">
                        {initials}
                      </div>
                    )}

                    {/* Attending Count Badge */}
                    {checkIn.attending_count > 0 && (
                      <div className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                        {checkIn.attending_count}
                      </div>
                    )}
                  </div>

                  {/* Pointer Stem */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: "8px solid transparent",
                      borderRight: "8px solid transparent",
                      borderTop: "8px solid rgb(34, 197, 94)", // green-500
                    }}
                  />
                </div>
              </AdvancedMarker>
            )
          })}

          {markerPosition && drawingMode && (
            <Marker
              position={markerPosition}
              zIndex={400}
              onClick={handleCustomMarkerClick}
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

          {!drawingMode && drawnType === "marker" && drawnCoordinates && (
            <Marker
              position={drawnCoordinates}
              zIndex={350}
              onClick={() => {
                console.log("[v0] Saved custom marker clicked, opening Google Maps")
                const url = `https://www.google.com/maps/search/?api=1&query=${drawnCoordinates.lat},${drawnCoordinates.lng}`
                window.open(url, "_blank")
              }}
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
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                <div className="absolute w-8 h-8 bg-blue-400 rounded-full opacity-30 animate-ping" />
              </div>
            </Marker>
          )}
        </Map>
      </APIProvider>

      {selectedLocation && (
        <div className="absolute top-4 right-4 z-20 max-w-sm">
          <LocationInfoCard
            location={selectedLocation}
            onClose={handleCloseInfoCard}
            minimal={minimal}
            eventCount={loadingEventCount ? undefined : selectedLocationEventCount}
            tenantSlug={tenantSlug} // Pass tenantSlug instead of tenantId
          />
        </div>
      )}

      {selectedCheckIn && (
        <CheckInDetailModal
          checkInId={selectedCheckIn}
          open={checkInModalOpen}
          onOpenChange={setCheckInModalOpen}
          tenantSlug={tenantSlug || ""}
          userId={tenantId || ""} // Assuming userId should be tenantId based on context
          tenantId={tenantId || ""}
        />
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
            <DropdownMenuRadioItem onClick={() => setMapType("roadmap")}>Street</DropdownMenuRadioItem>
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
