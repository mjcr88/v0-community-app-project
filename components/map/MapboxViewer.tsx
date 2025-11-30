"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import Map, { Source, Layer, MapRef, NavigationControl, GeolocateControl, Marker } from "react-map-gl"
import * as turf from "@turf/turf"
import { Search, X, Filter, Layers, Check, MapPin } from "lucide-react"
import "mapbox-gl/dist/mapbox-gl.css"

import { rsvpToCheckIn } from "@/app/actions/check-ins"

import { LocationWithRelations } from "@/lib/data/locations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface CheckIn {
    id: string
    resident: {
        id: string
        first_name: string
        last_name: string
        profile_picture_url?: string
    }
    location: {
        id: string
        name: string
        type: string
        coordinates?: { lat: number; lng: number }
    } | null
    coordinates?: { lat: number; lng: number }
    displayCoords?: { lat: number; lng: number }
    created_at: string
    expires_at: string
    // Additional properties used in component
    activity_type?: string
    title?: string
    custom_location_name?: string
    start_time?: string
    duration_minutes?: number
    description?: string
    visibility_scope?: string
    location_type?: string
    custom_location_coordinates?: { lat: number; lng: number }
    user_rsvp_status?: string | null
}

interface MapboxFullViewerProps {
    locations: LocationWithRelations[]
    checkIns?: CheckIn[]
    tenantId: string
    tenantSlug: string
    mapCenter?: { lat: number; lng: number } | null
    mapZoom?: number
    showControls?: boolean // Toggle top bar controls
    className?: string
    onLocationClick?: (locationId: string, location: LocationWithRelations) => void
    highlightLocationId?: string | null
    customMarker?: { lat: number; lng: number; label?: string } | null
    onMapClick?: (coords: { lat: number; lng: number }) => void
    onPoiClick?: (poi: { name: string; address?: string; lat: number; lng: number }) => void
    onMapMove?: (center: { lat: number; lng: number; zoom: number }) => void
    enableSelection?: boolean
    children?: React.ReactNode
}

export function MapboxFullViewer({
    locations,
    checkIns = [],
    tenantId,
    tenantSlug,
    mapCenter,
    mapZoom = 14,
    showControls = true,
    className,
    onLocationClick,
    highlightLocationId,
    customMarker,
    onMapClick,
    onPoiClick,
    onMapMove,
    enableSelection = true,
    children,
}: MapboxFullViewerProps) {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    // Calculate initial center - prioritize boundary center, then mapCenter prop, then default
    const initialCenter = useMemo(() => {
        const boundary = locations.find((loc) => loc.type === "boundary")
        if (boundary?.boundary_coordinates && boundary.boundary_coordinates.length > 0) {
            const lats = boundary.boundary_coordinates.map(([lat]) => lat)
            const lngs = boundary.boundary_coordinates.map(([, lng]) => lng)
            return {
                latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
                longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
                zoom: mapZoom, // Use passed zoom level
            }
        }
        return {
            latitude: mapCenter?.lat || 9.9567,
            longitude: mapCenter?.lng || -84.5333,
            zoom: mapZoom,
        }
    }, [locations, mapCenter, mapZoom])

    const [viewState, setViewState] = useState({
        longitude: initialCenter.longitude,
        latitude: initialCenter.latitude,
        zoom: initialCenter.zoom,
        pitch: 0,
        bearing: 0,
    })

    // Map state
    const [hoveredLot, setHoveredLot] = useState<string | null>(null)
    const [selectedLocation, setSelectedLocation] = useState<LocationWithRelations | CheckIn | null>(null)
    const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/satellite-streets-v12")
    const [currentZoom, setCurrentZoom] = useState(viewState.zoom)
    const mapRef = useRef<MapRef>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const hasUserInteracted = useRef(false) // Track if user manually selected a location

    // Debug logging
    useEffect(() => {
        console.log("[MapboxFullViewer] Mounted")
        console.log("[MapboxFullViewer] Token:", mapboxToken ? "Present" : "Missing")
        console.log("[MapboxFullViewer] Locations:", locations.length)
        console.log("[MapboxFullViewer] Map Center:", mapCenter)
        console.log("[MapboxFullViewer] Container Dimensions:", {
            width: containerRef.current?.offsetWidth,
            height: containerRef.current?.offsetHeight
        })
    }, [locations, mapCenter, mapboxToken])

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<LocationWithRelations[]>([])
    const [showSearchDropdown, setShowSearchDropdown] = useState(false)
    const [highlightedCategories, setHighlightedCategories] = useState<Set<string>>(new Set())

    // Collapsible panel state
    const [showLayersPanel, setShowLayersPanel] = useState(false)
    const [showBaseMapPanel, setShowBaseMapPanel] = useState(false)

    // Auto-focus map on location selection
    const focusOnLocation = useCallback(
        (location: LocationWithRelations | CheckIn, overrideZoom?: number) => {
            if (!mapRef.current) return

            let coords: { lat: number; lng: number } | null = null

            // Check if this is a check-in with displayCoords
            if ((location as CheckIn).displayCoords) {
                coords = (location as CheckIn).displayCoords || null
            }
            // Get coordinates based on location type
            else if (location.coordinates) {
                coords = location.coordinates
            } else if (
                (location as LocationWithRelations).boundary_coordinates &&
                (location as LocationWithRelations).boundary_coordinates!.length > 0
            ) {
                // For boundaries/polygons, use center
                const lats = (location as LocationWithRelations).boundary_coordinates!.map(([lat]: [number, number]) => lat)
                const lngs = (location as LocationWithRelations).boundary_coordinates!.map(([, lng]: [number, number]) => lng)
                coords = {
                    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
                    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
                }
            } else if (
                (location as LocationWithRelations).path_coordinates &&
                (location as LocationWithRelations).path_coordinates!.length > 0
            ) {
                // For lots/facilities with path_coordinates but no explicit coordinates
                const lats = (location as LocationWithRelations).path_coordinates!.map(([lat]: [number, number]) => lat)
                const lngs = (location as LocationWithRelations).path_coordinates!.map(([, lng]: [number, number]) => lng)
                coords = {
                    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
                    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
                }
            }

            if (coords) {
                mapRef.current.flyTo({
                    center: [coords.lng, coords.lat],
                    zoom: overrideZoom || Math.max(currentZoom, 18), // Use override or default zoom in
                    duration: 500, // Reduced from 1000ms for faster animation
                })
            }
        },
        [currentZoom],
    )

    // Effect to force map resize when sidebar opens/closes
    useEffect(() => {
        if (mapRef.current) {
            setTimeout(() => {
                mapRef.current?.resize()
            }, 300) // Wait for transition to complete
        }
    }, [selectedLocation, highlightedCategories])

    // Effect to resize map on mount and when container resizes (fixes blank map issues)
    useEffect(() => {
        if (!mapRef.current) return

        // Initial resize
        setTimeout(() => {
            mapRef.current?.resize()
        }, 500)

        // ResizeObserver to handle container size changes
        const resizeObserver = new ResizeObserver(() => {
            if (mapRef.current) {
                mapRef.current.resize()
            }
        })

        // Observe the map container's parent
        const mapContainer = mapRef.current.getMap().getContainer()
        if (mapContainer && mapContainer.parentElement) {
            resizeObserver.observe(mapContainer.parentElement)
        }

        return () => {
            resizeObserver.disconnect()
        }
    }, [])

    // Effect to fly to mapCenter prop changes
    useEffect(() => {
        if (mapCenter && mapRef.current) {
            mapRef.current.flyTo({
                center: [mapCenter.lng, mapCenter.lat],
                zoom: mapZoom, // Use the passed zoom level
                duration: 1000,
            })
        }
    }, [mapCenter, mapZoom])

    // Track last focused ID to prevent re-focusing on same location during re-renders
    const [lastFocusedId, setLastFocusedId] = useState<string | null>(null)

    // Effect to handle highlightLocationId prop
    useEffect(() => {
        // Only auto-select if it's a new ID (prevents re-focusing on refresh)
        if (highlightLocationId && highlightLocationId !== lastFocusedId) {
            const location = locations.find((l) => l.id === highlightLocationId)
            if (location) {
                setSelectedLocation(location)
                // Small timeout to allow map to load/resize before flying
                setTimeout(() => {
                    focusOnLocation(location, mapZoom) // Pass mapZoom to override default zoom
                    setLastFocusedId(highlightLocationId)
                }, 500)
            }
        }
    }, [highlightLocationId, locations, focusOnLocation, lastFocusedId, mapZoom])

    // Layer visibility toggles
    const [showBoundary, setShowBoundary] = useState(true)
    const [showLots, setShowLots] = useState(true)
    const [showFacilities, setShowFacilities] = useState(true)
    const [showStreets, setShowStreets] = useState(true)
    const [showPaths, setShowPaths] = useState(true)
    const [showCheckIns, setShowCheckIns] = useState(true)

    // Prepare GeoJSON for boundary
    const boundaryGeoJSON = useMemo(() => {
        const boundary = locations.find((loc) => loc.type === "boundary")
        if (!boundary?.boundary_coordinates) return null

        return {
            type: "Feature" as const,
            geometry: {
                type: "Polygon" as const,
                coordinates: [boundary.boundary_coordinates.map(([lat, lng]) => [lng, lat])],
            },
            properties: {
                id: boundary.id,
                name: boundary.name,
            },
        }
    }, [locations])

    // Prepare GeoJSON for lots
    const lotsGeoJSON = useMemo(() => {
        const features = locations
            .filter((loc) => loc.type === "lot" && loc.path_coordinates && loc.path_coordinates.length > 0)
            .map((lot) => ({
                type: "Feature" as const,
                geometry: {
                    type: "Polygon" as const,
                    // path_coordinates is where lot boundaries are stored
                    // Convert from [lat, lng] to [lng, lat] for Mapbox
                    coordinates: [lot.path_coordinates!.map(([lat, lng]) => [lng, lat])],
                },
                properties: {
                    id: lot.id,
                    name: lot.name,
                    neighborhood: lot.neighborhood?.name,
                },
            }))

        return {
            type: "FeatureCollection" as const,
            features,
        }
    }, [locations])

    // Calculate lot label positions using Turf (only for lots with proper names)
    const lotLabelsGeoJSON = useMemo(() => {
        const features = lotsGeoJSON.features
            .filter((feature) => {
                const name = feature.properties.name
                // Only show labels for lots with proper names (not "Imported LineString")
                return name && !name.toLowerCase().includes("imported") && !name.toLowerCase().includes("linestring")
            })
            .map((feature) => {
                const centroid = turf.centroid(feature)
                return {
                    type: "Feature" as const,
                    geometry: centroid.geometry,
                    properties: feature.properties,
                }
            })

        return {
            type: "FeatureCollection" as const,
            features,
        }
    }, [lotsGeoJSON])

    // Prepare GeoJSON for facilities
    const facilitiesGeoJSON = useMemo(() => {
        const features = locations
            .filter((loc) => loc.type === "facility" && loc.path_coordinates && loc.path_coordinates.length > 0)
            .map((fac) => ({
                type: "Feature" as const,
                geometry: {
                    type: "Polygon" as const,
                    // Convert from [lat, lng] to [lng, lat] for Mapbox
                    coordinates: [fac.path_coordinates!.map(([lat, lng]) => [lng, lat])],
                },
                properties: {
                    id: fac.id,
                    name: fac.name,
                    facility_type: fac.facility_type,
                    icon: fac.icon || "🏛️",
                },
            }))

        return {
            type: "FeatureCollection" as const,
            features,
        }
    }, [locations])

    // Calculate facility label positions using Turf
    const facilityLabelsGeoJSON = useMemo(() => {
        const features = facilitiesGeoJSON.features
            .map((feature) => {
                const centroid = turf.centroid(feature)
                return {
                    type: "Feature" as const,
                    geometry: centroid.geometry,
                    properties: feature.properties,
                }
            })

        return {
            type: "FeatureCollection" as const,
            features,
        }
    }, [facilitiesGeoJSON])

    // Prepare GeoJSON for streets
    const streetsGeoJSON = useMemo(() => {
        const features = locations
            .filter((loc) => loc.type === "public_street" && loc.path_coordinates)
            .map((street) => ({
                type: "Feature" as const,
                geometry: {
                    type: "LineString" as const,
                    coordinates: street.path_coordinates!.map(([lat, lng]) => [lng, lat]),
                },
                properties: {
                    id: street.id,
                    name: street.name,
                },
            }))

        return {
            type: "FeatureCollection" as const,
            features,
        }
    }, [locations])

    // Prepare GeoJSON for walking paths
    const pathsGeoJSON = useMemo(() => {
        const features = locations
            .filter((loc) => loc.type === "walking_path" && loc.path_coordinates)
            .map((path) => ({
                type: "Feature" as const,
                geometry: {
                    type: "LineString" as const,
                    coordinates: path.path_coordinates!.map(([lat, lng]) => [lng, lat]),
                },
                properties: {
                    id: path.id,
                    name: path.name,
                },
            }))

        return {
            type: "FeatureCollection" as const,
            features,
        }
    }, [locations])

    // Filter and distribute check-ins - only show LIVE/ACTIVE ones
    const distributedCheckIns = useMemo(() => {
        const now = Date.now()

        // First filter to only LIVE check-ins
        const liveCheckIns = checkIns.filter((checkIn: any) => {
            const startTime = new Date(checkIn.start_time).getTime()
            const durationMs = checkIn.duration_minutes * 60 * 1000
            const endTime = startTime + durationMs
            return endTime > now // Only show if hasn't expired
        })

        return liveCheckIns
            .map((checkIn: any) => {
                // Extract coordinates based on location type
                let coords = null

                if (checkIn.location_type === "community_location") {
                    // Get from linked location
                    coords = checkIn.location?.coordinates
                } else if (checkIn.location_type === "custom_temporary") {
                    // custom_location_coordinates is already an object {lat, lng}
                    coords = checkIn.custom_location_coordinates
                }

                if (!coords || !coords.lat || !coords.lng) {
                    return null
                }

                // Find all check-ins at roughly the same location
                const sameLocation = liveCheckIns.filter((ci: any) => {
                    let ciCoords = null
                    if (ci.location_type === "community_location") {
                        ciCoords = ci.location?.coordinates
                    } else if (ci.location_type === "custom_temporary") {
                        ciCoords = ci.custom_location_coordinates
                    }
                    if (!ciCoords) return false
                    return Math.abs(ciCoords.lat - coords.lat) < 0.0001 && Math.abs(ciCoords.lng - coords.lng) < 0.0001
                })

                // If only one check-in at this location, use exact coordinates
                if (sameLocation.length === 1) {
                    return {
                        ...checkIn,
                        displayCoords: coords,
                    }
                }

                // Otherwise distribute in a circle
                const ciIndex = sameLocation.findIndex((ci: any) => ci.id === checkIn.id)
                const angle = (ciIndex / sameLocation.length) * 2 * Math.PI
                const radius = 0.00008 // ~8 meters
                const distributed = {
                    lat: coords.lat + radius * Math.cos(angle),
                    lng: coords.lng + radius * Math.sin(angle),
                }

                return {
                    ...checkIn,
                    displayCoords: distributed,
                }
            })
            .filter(Boolean) as any[]
    }, [checkIns])

    // Search locations as user types
    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase()
            const results = locations
                .filter(
                    (loc) =>
                        loc.name.toLowerCase().includes(query) ||
                        loc.type.toLowerCase().includes(query) ||
                        loc.neighborhood?.name?.toLowerCase().includes(query),
                )
                .slice(0, 10) // Limit to 10 results
            setSearchResults(results)
            setShowSearchDropdown(true)
        } else {
            setSearchResults([])
            setShowSearchDropdown(false)
        }
    }, [searchQuery, locations])

    // Category buttons configuration
    const categoryButtons = useMemo(
        () => [
            {
                id: "boundary",
                label: "Boundary",
                icon: "🗺️",
                count: boundaryGeoJSON ? 1 : 0,
                type: "boundary",
            },
            {
                id: "lots",
                label: "Lots",
                icon: "🏡",
                count: lotsGeoJSON.features.length,
                type: "lot",
            },
            {
                id: "facilities",
                label: "Facilities",
                icon: "🏛️",
                count: facilitiesGeoJSON.features.length,
                type: "facility",
            },
            {
                id: "streets",
                label: "Streets",
                icon: "🛣️",
                count: streetsGeoJSON.features.length,
                type: "public_street",
            },
            {
                id: "paths",
                label: "Paths",
                icon: "🚶",
                count: pathsGeoJSON.features.length,
                type: "walking_path",
            },
            {
                id: "checkins",
                label: "Check-ins",
                icon: "📍",
                count: distributedCheckIns.length,
                type: "checkin",
            },
        ],
        [boundaryGeoJSON, lotsGeoJSON, facilitiesGeoJSON, streetsGeoJSON, pathsGeoJSON, distributedCheckIns],
    )



    if (!mapboxToken) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50">
                <Card className="p-6">
                    <p className="text-red-600">❌ Mapbox token not found in environment variables</p>
                    <p className="mt-2 text-sm text-muted-foreground">Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file</p>
                </Card>
            </div>
        )
    }

    return (
        <div className={`relative h-full w-full flex flex-col overflow-hidden ${className || ""}`}>
            {/* Top Bar - Search + Category Filters (hide if showControls is false) */}
            {showControls && (
                <div className="relative z-20 bg-white border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Input
                                type="text"
                                placeholder="Search locations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                                className="w-full"
                            />
                            {/* Search Results Dropdown */}
                            {showSearchDropdown && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-30">
                                    {searchResults.map((location) => (
                                        <button
                                            key={location.id}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                                            onClick={() => {
                                                hasUserInteracted.current = true
                                                setSelectedLocation(location)
                                                setSearchQuery("")
                                                setShowSearchDropdown(false)
                                                focusOnLocation(location)
                                            }}
                                        >
                                            <div className="font-medium text-sm">{location.name}</div>
                                            <div className="text-xs text-gray-500 capitalize flex items-center gap-2">
                                                <span>{location.type}</span>
                                                {location.neighborhood && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{location.neighborhood.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Category Filter Buttons */}
                        <div className="flex items-center gap-2">
                            {categoryButtons.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => {
                                        const newHighlighted = new Set(highlightedCategories)
                                        if (newHighlighted.has(category.type)) {
                                            newHighlighted.delete(category.type)
                                        } else {
                                            newHighlighted.add(category.type)
                                        }
                                        setHighlightedCategories(newHighlighted)
                                    }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${highlightedCategories.has(category.type)
                                        ? "bg-primary text-white border-primary shadow-sm"
                                        : "bg-white hover:bg-gray-50 border-gray-300"
                                        }`}
                                    disabled={category.count === 0}
                                >
                                    <span className="text-lg">{category.icon}</span>
                                    <span className="text-sm font-medium">{category.label}</span>
                                    <Badge
                                        variant={highlightedCategories.has(category.type) ? "secondary" : "outline"}
                                        className="ml-1 text-xs"
                                    >
                                        {category.count}
                                    </Badge>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area - Map + Sidebar */}
            <div className="relative flex-1 flex overflow-hidden">
                {/* Map Container - Responsive width based on selection */}
                <div
                    ref={containerRef}
                    className={`relative h-full ${enableSelection && (selectedLocation || highlightedCategories.size > 0) ? "w-2/3" : "w-full"
                        }`}
                >
                    <Map
                        {...viewState}
                        style={{ width: "100%", height: "100%" }}
                        mapStyle={mapStyle}
                        mapboxAccessToken={mapboxToken}
                        onMove={(evt) => {
                            setViewState(evt.viewState)
                            setCurrentZoom(evt.viewState.zoom)
                            if (onMapMove) {
                                onMapMove({
                                    lat: evt.viewState.latitude,
                                    lng: evt.viewState.longitude,
                                    zoom: evt.viewState.zoom,
                                })
                            }
                        }}
                        onLoad={() => console.log("[MapboxFullViewer] Map Loaded")}
                        onError={(e) => console.error("[MapboxFullViewer] Map Error:", e)}
                        ref={mapRef}
                        interactiveLayerIds={["lots-fill", "facilities-fill", "paths-line", "paths-hit-area", "streets-line", "poi-label"]}
                        onClick={(e: any) => {
                            if (e.features && e.features.length > 0) {
                                const feature = e.features[0]

                                // Handle Community Location Click
                                if (
                                    feature.layer.id === "lots-fill" ||
                                    feature.layer.id === "facilities-fill" ||
                                    feature.layer.id === "paths-line" ||
                                    feature.layer.id === "paths-hit-area" ||
                                    feature.layer.id === "streets-line"
                                ) {
                                    const locationId = feature.properties.id
                                    const location = locations.find((loc) => loc.id === locationId)
                                    if (location) {
                                        // Call external callback if provided
                                        if (onLocationClick) {
                                            onLocationClick(locationId, location)
                                        }
                                        // Set internal state only if selection is enabled
                                        if (enableSelection) {
                                            hasUserInteracted.current = true
                                            setSelectedLocation(location)
                                        }
                                    }
                                }
                                // Handle POI Click
                                else if (feature.layer.id === "poi-label" && onPoiClick) {
                                    const name = feature.properties.name || "Unknown Location"
                                    const address = feature.properties.address

                                    onPoiClick({
                                        name,
                                        address,
                                        lat: e.lngLat.lat,
                                        lng: e.lngLat.lng,
                                    })
                                }
                            } else {
                                setSelectedLocation(null)
                                // Handle background click (for pin dropping)
                                if (onMapClick) {
                                    onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng })
                                }
                            }
                        }}
                        onMouseEnter={useCallback((e: any) => {
                            if (e.features && e.features.length > 0) {
                                setHoveredLot(e.features[0].properties.id)
                            }
                        }, [])}
                        onMouseLeave={useCallback(() => setHoveredLot(null), [])}
                        cursor={hoveredLot ? "pointer" : "grab"}
                        terrain={
                            mapStyle === "mapbox://styles/mapbox/satellite-streets-v12" && viewState.pitch > 0
                                ? { source: "mapbox-dem", exaggeration: 1.5 }
                                : undefined
                        }
                        maxPitch={85}
                        dragRotate={true}
                        touchZoomRotate={true}
                    >
                        {/* Terrain Source - Always render */}
                        <Source
                            id="mapbox-dem"
                            type="raster-dem"
                            url="mapbox://mapbox.mapbox-terrain-dem-v1"
                            tileSize={512}
                            maxzoom={14}
                        />

                        {/* Community Boundary */}
                        {showBoundary && boundaryGeoJSON && (
                            <Source id="boundary" type="geojson" data={boundaryGeoJSON}>
                                <Layer
                                    id="boundary-line"
                                    type="line"
                                    paint={{
                                        "line-color": "#D97742", // Sunrise Orange
                                        "line-width": 3,
                                        "line-opacity": 0.9,
                                    }}
                                />
                            </Source>
                        )}

                        {children}

                        {/* Lots - Fill */}
                        {showLots && (
                            <Source id="lots" type="geojson" data={lotsGeoJSON}>
                                <Layer
                                    id="lots-fill"
                                    type="fill"
                                    paint={{
                                        "fill-color": "#86B25C",
                                        "fill-opacity": 0.3,
                                    }}
                                />

                                {/* Lots - Border */}
                                <Layer
                                    id="lots-border"
                                    type="line"
                                    paint={{
                                        "line-color": [
                                            "case",
                                            ["boolean", ["feature-state", "selected"], false],
                                            "#F97316", // Orange when individually selected
                                            ["==", ["get", "id"], selectedLocation?.id || ""],
                                            "#F97316", // Orange when ID matches
                                            highlightedCategories.has("lot") ? "#F97316" : "#2D5016", // Orange when category highlighted
                                        ],
                                        "line-width": [
                                            "case",
                                            ["==", ["get", "id"], selectedLocation?.id || ""],
                                            3, // Thicker orange border for selected
                                            2, // Normal width
                                        ],
                                    }}
                                />
                            </Source>
                        )}

                        {/* Lot Labels */}
                        {showLots && (
                            <Source id="lot-labels" type="geojson" data={lotLabelsGeoJSON}>
                                <Layer
                                    id="lot-labels"
                                    type="symbol"
                                    minzoom={15} // Only show labels when zoomed in
                                    layout={{
                                        "text-field": ["get", "name"],
                                        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
                                        "text-size": 11,
                                        "text-anchor": "center",
                                    }}
                                    paint={{
                                        "text-color": "#059669",
                                        "text-halo-color": "#FFFFFF",
                                        "text-halo-width": 1.5,
                                    }}
                                />
                            </Source>
                        )}

                        {/* Facilities - Icons */}
                        {showFacilities && facilitiesGeoJSON.features.length > 0 && (
                            <Source id="facilities" type="geojson" data={facilitiesGeoJSON}>
                                {/* Facility Fill */}
                                <Layer
                                    id="facilities-fill"
                                    type="fill"
                                    paint={{
                                        "fill-color": "#3B82F6",
                                        "fill-opacity": 0.2,
                                    }}
                                />

                                {/* Facility Border */}
                                <Layer
                                    id="facilities-border"
                                    type="line"
                                    paint={{
                                        "line-color": [
                                            "case",
                                            ["boolean", ["feature-state", "selected"], false],
                                            "#F97316", // Orange when individually selected
                                            ["==", ["get", "id"], selectedLocation?.id || ""],
                                            "#F97316", // Orange when ID matches
                                            highlightedCategories.has("facility") ? "#F97316" : "#1E40AF", // Orange when category highlighted
                                        ],
                                        "line-width": 2,
                                    }}
                                />
                            </Source>
                        )}

                        {/* Facility Labels */}
                        {showFacilities && (
                            <Source id="facility-labels" type="geojson" data={facilityLabelsGeoJSON}>
                                <Layer
                                    id="facility-labels"
                                    type="symbol"
                                    minzoom={13}
                                    layout={{
                                        "text-field": ["get", "name"],
                                        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
                                        "text-size": 11,
                                        "text-anchor": "center",
                                    }}
                                    paint={{
                                        "text-color": "#1E40AF",
                                        "text-halo-color": "#FFFFFF",
                                        "text-halo-width": 1.5,
                                    }}
                                />
                            </Source>
                        )}

                        {/* Facility Markers (Points) */}
                        {showFacilities && locations.map(location => {
                            if (location.type !== 'facility' || !location.coordinates || (location.path_coordinates && location.path_coordinates.length > 0)) return null;

                            const isHighlighted = highlightedCategories.has('facility');
                            const isSelected = selectedLocation?.id === location.id;

                            return (
                                <Marker
                                    key={location.id}
                                    longitude={location.coordinates.lng}
                                    latitude={location.coordinates.lat}
                                    anchor="bottom"
                                    style={{ zIndex: isSelected ? 40 : 5 }}
                                    onClick={(e) => {
                                        e.originalEvent.stopPropagation();
                                        if (onLocationClick) {
                                            onLocationClick(location.id, location);
                                        }
                                        setSelectedLocation(location);
                                        focusOnLocation(location);
                                    }}
                                >
                                    <div className={`cursor-pointer transform transition-transform hover:scale-110 ${isHighlighted ? 'scale-110' : ''}`}>
                                        {isHighlighted && (
                                            <div className="absolute -inset-2 rounded-full border-2 border-[#F97316] animate-pulse opacity-70"></div>
                                        )}
                                        <div className={`bg-white p-1.5 rounded-full shadow-md border ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-gray-200'} text-xl flex items-center justify-center w-10 h-10`}>
                                            {location.icon || '🏛️'}
                                        </div>
                                    </div>
                                </Marker>
                            );
                        })}

                        {/* Streets */}
                        {showStreets && streetsGeoJSON.features.length > 0 && (
                            <Source id="streets" type="geojson" data={streetsGeoJSON}>
                                <Layer
                                    id="streets-line"
                                    type="line"
                                    paint={{
                                        "line-color": highlightedCategories.has("public_street") ? "#F97316" : "#F59E0B",
                                        "line-width": 4,
                                        "line-opacity": 0.8,
                                    }}
                                />
                            </Source>
                        )}

                        {/* Walking Paths */}
                        {showPaths && pathsGeoJSON.features.length > 0 && (
                            <Source id="paths" type="geojson" data={pathsGeoJSON}>
                                <Layer
                                    id="paths-hit-area"
                                    type="line"
                                    paint={{
                                        "line-color": "#ffffff",
                                        "line-width": 20,
                                        "line-opacity": 0,
                                    }}
                                />
                                <Layer
                                    id="paths-line"
                                    type="line"
                                    paint={{
                                        "line-color": highlightedCategories.has("walking_path") ? "#F97316" : "#84CC16",
                                        "line-width": 2,
                                        "line-dasharray": [2, 1],
                                        "line-opacity": 0.8,
                                    }}
                                />
                            </Source>
                        )}
                        {/* Custom Marker */}
                        {customMarker && (
                            <Marker latitude={customMarker.lat} longitude={customMarker.lng} anchor="bottom">
                                <div className="flex flex-col items-center">
                                    <div className="bg-white px-2 py-1 rounded shadow text-xs font-medium mb-1 whitespace-nowrap">
                                        {customMarker.label || "Custom Location"}
                                    </div>
                                    <MapPin className="h-8 w-8 text-primary fill-current" />
                                </div>
                            </Marker>
                        )}

                        {/* Facility Markers (Points) - Only show when zoomed in */}
                        {showFacilities &&
                            locations.map((location) => {
                                // Only show markers for Point facilities (no path_coordinates)
                                // Polygon facilities are rendered via the facilities-fill layer
                                if (
                                    location.type !== "facility" ||
                                    !location.coordinates ||
                                    (location.path_coordinates && location.path_coordinates.length > 0)
                                )
                                    return null

                                const isHighlighted = highlightedCategories.has("facility")
                                const isSelected = selectedLocation?.id === location.id

                                return (
                                    <Marker
                                        key={location.id}
                                        longitude={location.coordinates.lng}
                                        latitude={location.coordinates.lat}
                                        anchor="bottom"
                                        style={{ zIndex: isSelected ? 40 : 5 }}
                                        onClick={(e) => {
                                            e.originalEvent.stopPropagation()
                                            if (onLocationClick) {
                                                onLocationClick(location.id, location)
                                            }
                                            hasUserInteracted.current = true
                                            setSelectedLocation(location)
                                            focusOnLocation(location)
                                        }}
                                    >
                                        <div
                                            className={`cursor-pointer transform transition-transform hover:scale-110 ${isHighlighted ? "scale-110" : ""
                                                }`}
                                        >
                                            {isHighlighted && (
                                                <div className="absolute -inset-2 rounded-full border-2 border-[#F97316] animate-pulse opacity-70"></div>
                                            )}
                                            <div
                                                className={`bg-white p-1.5 rounded-full shadow-md border ${isSelected ? "border-primary ring-2 ring-primary ring-offset-1" : "border-gray-200"
                                                    } text-xl flex items-center justify-center w-10 h-10`}
                                            >
                                                {location.icon || "🏛️"}
                                            </div>
                                        </div>
                                    </Marker>
                                )
                            })}

                        {/* Map Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                            <NavigationControl showCompass={true} showZoom={true} />
                            <GeolocateControl
                                positionOptions={{ enableHighAccuracy: true }}
                                trackUserLocation={true}
                                showUserHeading={true}
                            />
                            {/* Reset Camera Button */}
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-[29px] w-[29px] rounded-md bg-white shadow-md hover:bg-gray-100"
                                onClick={() => {
                                    mapRef.current?.flyTo({
                                        pitch: 0,
                                        bearing: 0,
                                        duration: 1000,
                                    })
                                }}
                                title="Reset Camera"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" />
                                    <path d="M3 3v9h9" />
                                </svg>
                            </Button>
                        </div>

                        {/* Collapsible Layer Toggle Button */}
                        <div className="absolute left-4 top-4 z-10">
                            <button
                                onClick={() => {
                                    setShowLayersPanel(!showLayersPanel)
                                    if (!showLayersPanel) setShowBaseMapPanel(false)
                                }}
                                className="mapboxgl-ctrl mapboxgl-ctrl-group"
                                title="Toggle Layers"
                                style={{
                                    width: "29px",
                                    height: "29px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "white",
                                    border: "none",
                                    cursor: "pointer",
                                    borderRadius: "4px",
                                    boxShadow: "0 0 0 2px rgba(0,0,0,0.1)",
                                }}
                            >
                                <Layers className="h-4 w-4 text-gray-700" />
                            </button>

                            {/* Expandable Layers Panel */}
                            {showLayersPanel && (
                                <div className="mt-2 rounded-lg border bg-white p-4 shadow-lg w-56">
                                    <h3 className="mb-3 font-semibold text-sm">Map Layers</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={showBoundary}
                                                onChange={(e) => setShowBoundary(e.target.checked)}
                                                className="rounded"
                                            />
                                            Community Boundary
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={showLots}
                                                onChange={(e) => setShowLots(e.target.checked)}
                                                className="rounded"
                                            />
                                            Lots ({lotsGeoJSON.features.length})
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={showFacilities}
                                                onChange={(e) => setShowFacilities(e.target.checked)}
                                                className="rounded"
                                            />
                                            Facilities ({facilitiesGeoJSON.features.length})
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={showStreets}
                                                onChange={(e) => setShowStreets(e.target.checked)}
                                                className="rounded"
                                            />
                                            Streets ({streetsGeoJSON.features.length})
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={showPaths}
                                                onChange={(e) => setShowPaths(e.target.checked)}
                                                className="rounded"
                                            />
                                            Walking Paths ({pathsGeoJSON.features.length})
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={showCheckIns}
                                                onChange={(e) => setShowCheckIns(e.target.checked)}
                                                className="rounded"
                                            />
                                            Check-ins ({distributedCheckIns.length})
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Collapsible Base Map Button */}
                        <div className="absolute left-16 top-4 z-10">
                            <button
                                onClick={() => {
                                    setShowBaseMapPanel(!showBaseMapPanel)
                                    if (!showBaseMapPanel) setShowLayersPanel(false)
                                }}
                                className="mapboxgl-ctrl mapboxgl-ctrl-group"
                                title="Change Base Map"
                                style={{
                                    width: "29px",
                                    height: "29px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "white",
                                    border: "none",
                                    cursor: "pointer",
                                    borderRadius: "4px",
                                    boxShadow: "0 0 0 2px rgba(0,0,0,0.1)",
                                }}
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ color: "#333" }}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                    />
                                </svg>
                            </button>

                            {/* Expandable Base Map Panel */}
                            {showBaseMapPanel && (
                                <div className="mt-2 rounded-lg border bg-white p-4 shadow-lg w-64">
                                    <h4 className="mb-3 text-sm font-semibold">Base Map</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                setMapStyle("mapbox://styles/mapbox/satellite-streets-v12")
                                                mapRef.current?.flyTo({
                                                    pitch: 0,
                                                    bearing: 0,
                                                    duration: 1000,
                                                })
                                            }}
                                            className={`px-3 py-2 text-xs rounded-md border transition-colors ${mapStyle === "mapbox://styles/mapbox/satellite-streets-v12" && viewState.pitch <= 60
                                                ? "bg-primary text-white border-primary"
                                                : "bg-white hover:bg-gray-50 border-gray-300"
                                                }`}
                                        >
                                            Satellite
                                        </button>
                                        <button
                                            onClick={() => setMapStyle("mapbox://styles/mapbox/streets-v12")}
                                            className={`px-3 py-2 text-xs rounded-md border transition-colors ${mapStyle === "mapbox://styles/mapbox/streets-v12"
                                                ? "bg-primary text-white border-primary"
                                                : "bg-white hover:bg-gray-50 border-gray-300"
                                                }`}
                                        >
                                            Streets
                                        </button>
                                        <button
                                            onClick={() => setMapStyle("mapbox://styles/mapbox/outdoors-v12")}
                                            className={`px-3 py-2 text-xs rounded-md border transition-colors ${mapStyle === "mapbox://styles/mapbox/outdoors-v12"
                                                ? "bg-primary text-white border-primary"
                                                : "bg-white hover:bg-gray-50 border-gray-300"
                                                }`}
                                        >
                                            Outdoors
                                        </button>
                                        <button
                                            onClick={() => {
                                                setMapStyle("mapbox://styles/mapbox/satellite-streets-v12")
                                                mapRef.current?.flyTo({
                                                    pitch: 80,
                                                    zoom: 16,
                                                    duration: 2000,
                                                })
                                            }}
                                            className={`px-3 py-2 text-xs rounded-md border transition-colors ${mapStyle === "mapbox://styles/mapbox/satellite-streets-v12" && viewState.pitch > 60
                                                ? "bg-primary text-white border-primary"
                                                : "bg-white hover:bg-gray-50 border-gray-300"
                                                }`}
                                        >
                                            3D Terrain
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Check-in Markers with Profile Pictures - Only show when zoomed in */}
                        {showCheckIns && currentZoom >= 14 &&
                            distributedCheckIns.map(checkIn => {
                                if (!checkIn?.displayCoords) return null;
                                const isHighlighted = highlightedCategories.has('checkin');
                                const isSelected = selectedLocation?.id === checkIn.id;

                                return (
                                    <Marker
                                        key={checkIn.id}
                                        longitude={checkIn.displayCoords.lng}
                                        latitude={checkIn.displayCoords.lat}
                                        anchor="center"
                                        style={{ zIndex: isSelected ? 50 : 10 }} // Bring selected to front
                                    >
                                        <div
                                            className={`group relative cursor-pointer transition-all duration-300 ${isHighlighted ? 'scale-110' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('[Mapbox] Check-in clicked:', checkIn);
                                                console.log('[Mapbox] Setting selectedLocation to:', checkIn);
                                                hasUserInteracted.current = true
                                                setSelectedLocation(checkIn);
                                                focusOnLocation(checkIn);
                                            }}
                                        >
                                            {/* Highlight Ring */}
                                            {isHighlighted && (
                                                <div className="absolute -inset-2 rounded-full border-2 border-[#F97316] animate-pulse opacity-70"></div>
                                            )}

                                            {/* Avatar + Pulse */}
                                            <div className="relative">
                                                <img
                                                    src={checkIn.resident.profile_picture_url || '/default-avatar.png'}
                                                    alt={checkIn.resident.first_name}
                                                    className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-lg transition-transform group-hover:scale-110"
                                                />
                                                {/* Pulse animation */}
                                                <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary opacity-75" />
                                            </div>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white group-hover:block">
                                                {checkIn.resident.first_name}
                                                {checkIn.location?.name && ` @ ${checkIn.location.name}`}
                                            </div>
                                        </div>
                                    </Marker>
                                );
                            })}
                    </Map>
                </div>

                {/* Sidebar - Shows single selection */}
                <div
                    className={`relative h-full bg-white border-l border-gray-200 transition-all duration-300 ease-in-out overflow-y-auto ${enableSelection && (selectedLocation || highlightedCategories.size > 0) ? "w-1/3" : "w-0"
                        }`}
                >
                    {selectedLocation ? (
                        <div className="p-6">
                            {/* Check if this is a check-in */}
                            {(selectedLocation as CheckIn).activity_type ? (
                                /* Check-in Card */
                                <>
                                    {/* Header with Close Button */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 className="font-semibold text-2xl mb-2">
                                                {(selectedLocation as CheckIn).title || "Check-in"}
                                            </h2>
                                            <Badge variant="secondary" className="capitalize">
                                                {(selectedLocation as CheckIn).activity_type}
                                            </Badge>
                                        </div>
                                        <button
                                            onClick={() => setSelectedLocation(null)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                                            title="Close"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    {/* User Info */}
                                    {(selectedLocation as CheckIn).resident && (
                                        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                            <img
                                                src={(selectedLocation as CheckIn).resident.profile_picture_url || "/default-avatar.png"}
                                                alt={(selectedLocation as CheckIn).resident.first_name}
                                                className="h-12 w-12 rounded-full object-cover border-2 border-white shadow"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {(selectedLocation as CheckIn).resident.first_name}{" "}
                                                    {(selectedLocation as CheckIn).resident.last_name}
                                                </p>
                                                <p className="text-sm text-gray-500">Checked in</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Location */}
                                    {(selectedLocation as CheckIn).location?.name && (
                                        <div className="mb-3">
                                            <span className="text-sm font-medium text-gray-500">Location</span>
                                            <p className="text-gray-900">{(selectedLocation as CheckIn).location?.name}</p>
                                        </div>
                                    )}
                                    {(selectedLocation as CheckIn).custom_location_name && (
                                        <div className="mb-3">
                                            <span className="text-sm font-medium text-gray-500">Location</span>
                                            <p className="text-gray-900">{(selectedLocation as CheckIn).custom_location_name}</p>
                                        </div>
                                    )}

                                    {/* Time & Remaining Duration */}
                                    <div className="space-y-3 mb-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            {(selectedLocation as CheckIn).start_time && (
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500">Started</span>
                                                    <p className="text-gray-900">
                                                        {new Date((selectedLocation as CheckIn).start_time!).toLocaleTimeString("en-US", {
                                                            hour: "numeric",
                                                            minute: "2-digit",
                                                            hour12: true,
                                                        })}
                                                    </p>
                                                </div>
                                            )}
                                            {(selectedLocation as CheckIn).duration_minutes && (
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500">Duration</span>
                                                    <p className="text-gray-900">{(selectedLocation as CheckIn).duration_minutes} min</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Remaining Time Timer */}
                                        {(() => {
                                            const startTime = new Date((selectedLocation as CheckIn).start_time!).getTime()
                                            const durationMs = (selectedLocation as CheckIn).duration_minutes! * 60 * 1000
                                            const endTime = startTime + durationMs
                                            const now = Date.now()
                                            const remainingTime = Math.max(0, endTime - now)

                                            if (remainingTime > 0) {
                                                return (
                                                    <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Time Remaining</span>
                                                            <span className="text-lg font-bold text-primary">
                                                                {Math.floor(remainingTime / 60000)}:
                                                                {Math.floor((remainingTime % 60000) / 1000)
                                                                    .toString()
                                                                    .padStart(2, "0")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            } else {
                                                return (
                                                    <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Status</span>
                                                            <span className="text-lg font-bold text-gray-500">Expired</span>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        })()}
                                    </div>

                                    {/* Description */}
                                    {(selectedLocation as CheckIn).description && (
                                        <div className="mb-4">
                                            <span className="text-sm font-medium text-gray-500">Message</span>
                                            <p className="text-gray-900 mt-1">{(selectedLocation as CheckIn).description}</p>
                                        </div>
                                    )}

                                    {/* Visibility */}
                                    <div className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                        </svg>
                                        <span className="capitalize">
                                            {(selectedLocation as CheckIn).visibility_scope || "community"}
                                        </span>
                                    </div>

                                    {/* RSVP Actions */}
                                    <div className="border-t pt-4 mt-2">
                                        <p className="text-sm font-medium text-gray-700 mb-3">Are you joining?</p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className={`flex-1 gap-2 ${(selectedLocation as any).user_rsvp_status === "yes"
                                                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                    : ""
                                                    }`}
                                                onClick={async () => {
                                                    const checkIn = selectedLocation as CheckIn
                                                    const newStatus = (checkIn as any).user_rsvp_status === "yes" ? null : "yes"

                                                    // Optimistic update
                                                    setSelectedLocation({
                                                        ...checkIn,
                                                        user_rsvp_status: newStatus,
                                                    } as any)

                                                    try {
                                                        const apiStatus = newStatus === null ? "no" : "yes"
                                                        await rsvpToCheckIn(checkIn.id, tenantId, tenantSlug, apiStatus)
                                                    } catch (error) {
                                                        console.error("Failed to RSVP:", error)
                                                        // Revert
                                                        hasUserInteracted.current = true
                                                        setSelectedLocation(checkIn)
                                                    }
                                                }}
                                            >
                                                <Check className="h-4 w-4" />
                                                Going
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className={`flex-1 gap-2 ${(selectedLocation as any).user_rsvp_status === "maybe"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                                    : ""
                                                    }`}
                                                onClick={async () => {
                                                    const checkIn = selectedLocation as CheckIn
                                                    const newStatus = (checkIn as any).user_rsvp_status === "maybe" ? null : "maybe"

                                                    setSelectedLocation({
                                                        ...checkIn,
                                                        user_rsvp_status: newStatus,
                                                    } as any)

                                                    try {
                                                        const apiStatus = newStatus === null ? "no" : "maybe"
                                                        await rsvpToCheckIn(checkIn.id, tenantId, tenantSlug, apiStatus)
                                                    } catch (error) {
                                                        console.error("Failed to RSVP:", error)
                                                        setSelectedLocation(checkIn)
                                                    }
                                                }}
                                            >
                                                ? Maybe
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className={`flex-1 gap-2 ${(selectedLocation as any).user_rsvp_status === "no"
                                                    ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                                    : ""
                                                    }`}
                                                onClick={async () => {
                                                    const checkIn = selectedLocation as CheckIn
                                                    const newStatus = (checkIn as any).user_rsvp_status === "no" ? null : "no"

                                                    setSelectedLocation({
                                                        ...checkIn,
                                                        user_rsvp_status: newStatus,
                                                    } as any)

                                                    try {
                                                        // If toggling off 'no', we effectively remove the RSVP (or set to 'no' again? Logic implies 'no' is explicit)
                                                        // For now, let's treat 'no' as explicit decline.
                                                        const apiStatus = "no"
                                                        await rsvpToCheckIn(checkIn.id, tenantId, tenantSlug, apiStatus)
                                                    } catch (error) {
                                                        console.error("Failed to RSVP:", error)
                                                        setSelectedLocation(checkIn)
                                                    }
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                                Can't
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Regular Location Card */
                                <>
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 className="font-semibold text-2xl mb-2">
                                                {(selectedLocation as any).name || (selectedLocation as any).title || "Location"}
                                            </h2>
                                            <Badge variant="secondary" className="capitalize">
                                                {((selectedLocation as any).type || (selectedLocation as any).activity_type || "Location").replace("_", " ")}
                                            </Badge>
                                        </div>
                                        <button
                                            onClick={() => setSelectedLocation(null)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                                            title="Close"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    {/* Hero Photo */}
                                    {((selectedLocation as any).hero_photo ||
                                        ((selectedLocation as any).photos && (selectedLocation as any).photos.length > 0)) && (
                                            <div className="mb-4 rounded-lg overflow-hidden">
                                                <img
                                                    src={(selectedLocation as any).hero_photo || (selectedLocation as any).photos[0]}
                                                    alt={(selectedLocation as any).name}
                                                    className="w-full h-48 object-cover"
                                                />
                                            </div>
                                        )}
                                </>
                            )}

                            {/* Resident Info (for lots) */}
                            {(selectedLocation as any).type === "lot" && (selectedLocation as any).residents && (selectedLocation as any).residents.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Residents</h3>
                                    <div className="space-y-3">
                                        {(selectedLocation as any).residents.map((resident: any) => (
                                            <div key={resident.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                                {resident.profile_picture_url ? (
                                                    <img
                                                        src={resident.profile_picture_url}
                                                        alt={`${resident.first_name} ${resident.last_name}`}
                                                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium border border-primary/20">
                                                        {resident.first_name[0]}
                                                        {resident.last_name[0]}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium">
                                                        {resident.first_name} {resident.last_name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">Resident</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {(selectedLocation as any).description && !(selectedLocation as any).activity_type && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">About</h3>
                                    <p className="text-gray-700 leading-relaxed">{(selectedLocation as any).description}</p>
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {(selectedLocation as any).neighborhood && (
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-500 mb-1">Neighborhood</div>
                                        <div className="font-medium text-sm">{(selectedLocation as any).neighborhood.name}</div>
                                    </div>
                                )}
                                {(selectedLocation as any).facility_type && (
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-500 mb-1">Type</div>
                                        <div className="font-medium text-sm capitalize">
                                            {(selectedLocation as any).facility_type.replace("_", " ")}
                                        </div>
                                    </div>
                                )}


                                {(selectedLocation as any).hours && (
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-500 mb-1">Hours</div>
                                        <div className="font-medium text-sm">{(selectedLocation as any).hours}</div>
                                    </div>
                                )}

                                {/* Lot-specific info */}
                                {(selectedLocation as any).type === "lot" && (
                                    <>
                                    </>
                                )}

                                {/* Facility: Capacity, Parking */}
                                {(selectedLocation as any).type === "facility" && (
                                    <>
                                        {(selectedLocation as any).capacity && (
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-xs text-gray-500 mb-1">Capacity</div>
                                                <div className="font-medium text-sm">{(selectedLocation as any).capacity} people</div>
                                            </div>
                                        )}
                                        {(selectedLocation as any).accessibility_features &&
                                            Array.isArray((selectedLocation as any).accessibility_features) && (selectedLocation as any).accessibility_features.length > 0 && (
                                                <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                                                    <span className="text-xs text-gray-500 mb-1 block">Accessibility</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(selectedLocation as any).accessibility_features.map((feature: string) => (
                                                            <Badge key={feature} variant="outline" className="text-xs bg-white">
                                                                {feature.replace("_", " ")}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                    </>
                                )}

                                {(selectedLocation as any).amenities && (selectedLocation as any).amenities.length > 0 && (
                                    <div className="col-span-2">
                                        <span className="text-sm font-medium text-gray-500 block mb-2">Amenities</span>
                                        <div className="flex flex-wrap gap-1">
                                            {(selectedLocation as any).amenities.map((amenity: string, idx: number) => (
                                                <Badge key={idx} variant="outline">
                                                    {amenity}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}


                            </div>

                            {!(selectedLocation as any).activity_type && (
                                <div className="mt-auto pt-4 border-t">
                                    <Button
                                        className="w-full"
                                        onClick={() => window.open(`/t/${tenantSlug}/dashboard/locations/${selectedLocation.id}`, "_blank")}
                                    >
                                        View Full Details
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Category List View (when no location selected but categories highlighted)
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-xl">
                                    {highlightedCategories.size > 0
                                        ? `Showing ${Array.from(highlightedCategories)
                                            .map((c) => {
                                                const btn = categoryButtons.find(btn => btn.type === c)
                                                return btn ? btn.label : c.replace("_", " ")
                                            })
                                            .join(", ")}`
                                        : "Select a location"}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setHighlightedCategories(new Set())}
                                    className="text-gray-500 hover:text-gray-900"
                                >
                                    Clear all
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {/* Check-ins List */}
                                {highlightedCategories.has("checkin") && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                                            Active Check-ins
                                        </h3>
                                        {distributedCheckIns.length > 0 ? (
                                            distributedCheckIns.map((checkIn) => {
                                                // Calculate time remaining for list item
                                                const startTime = new Date(checkIn.start_time!).getTime()
                                                const durationMs = checkIn.duration_minutes! * 60 * 1000
                                                const endTime = startTime + durationMs
                                                const now = Date.now()
                                                const timeRemaining = Math.max(0, endTime - now)
                                                const minutes = Math.floor(timeRemaining / 60000)

                                                return (
                                                    <button
                                                        key={checkIn.id}
                                                        onClick={() => {
                                                            hasUserInteracted.current = true
                                                            setSelectedLocation(checkIn)
                                                            focusOnLocation(checkIn)
                                                        }}
                                                        className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-gray-50 transition-all text-left group"
                                                    >
                                                        <div className="relative">
                                                            <img
                                                                src={checkIn.resident.profile_picture_url || "/default-avatar.png"}
                                                                alt={checkIn.resident.first_name}
                                                                className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                                            />
                                                            <div className="absolute -bottom-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white"></div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium text-gray-900 truncate">
                                                                    {checkIn.resident.first_name} {checkIn.resident.last_name?.[0]}.
                                                                </span>
                                                                <Badge variant={timeRemaining > 300000 ? "outline" : "destructive"} className="text-[10px] h-5 px-1.5 font-mono">
                                                                    {minutes}m left
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-gray-600 truncate mt-0.5">
                                                                at {checkIn.custom_location_name || checkIn.location?.name || "Unknown Location"}
                                                            </p>
                                                        </div>
                                                    </button>
                                                )
                                            })
                                        ) : (
                                            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                                <p className="text-sm">No active check-ins found</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Other Categories List */}
                                {Array.from(highlightedCategories)
                                    .filter((c) => c !== "checkin")
                                    .map((categoryType) => {
                                        const categoryLocations = locations.filter((loc) => loc.type === categoryType)
                                        if (categoryLocations.length === 0) return null

                                        return (
                                            <div key={categoryType} className="space-y-2">
                                                {highlightedCategories.size > 1 && (
                                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                        {categoryButtons.find((c) => c.type === categoryType)?.label}
                                                    </h3>
                                                )}
                                                {categoryLocations.map((location) => (
                                                    <button
                                                        key={location.id}
                                                        onClick={() => {
                                                            hasUserInteracted.current = true
                                                            setSelectedLocation(location)
                                                            focusOnLocation(location)
                                                        }}
                                                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-gray-50 transition-all text-left"
                                                    >
                                                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">
                                                            {categoryButtons.find((c) => c.type === location.type)?.icon}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{location.name}</div>
                                                            {location.neighborhood && (
                                                                <div className="text-xs text-gray-500">{location.neighborhood.name}</div>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )}
                </div >
            </div >
        </div >
    )
}
