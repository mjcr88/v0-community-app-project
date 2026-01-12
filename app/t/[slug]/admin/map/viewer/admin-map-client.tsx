'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Map, { Source, Layer, Marker, NavigationControl, GeolocateControl, MapRef } from 'react-map-gl';
import * as turf from '@turf/turf';
import {
    Search, MapPin, Filter, Layers, Navigation, Info, X,
    Maximize2, Minimize2, Home, Building2, Car, TreePine,
    Users, Calendar, CheckCircle2, AlertCircle, Check, Edit, Download
} from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

import { LocationWithRelations } from '@/lib/data/locations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EditLocationDialog } from '@/components/map/EditLocationDialog';
import { rsvpToCheckIn } from '@/app/actions/check-ins';
import { CheckInWithRelations } from '@/lib/data/check-ins';
import { deleteLocation, updateLocation, createLocation } from '@/app/actions/locations';
import { toast } from 'sonner';




export interface AdminMapClientProps {
    locations: LocationWithRelations[];
    tenantId: string;
    tenantSlug: string;
    checkIns: CheckInWithRelations[];
    mapCenter?: { lat: number; lng: number };
    mapZoom?: number;
    minimal?: boolean; // If true, hides sidebar and some controls
    className?: string;
    highlightLocationId?: string; // ID of location to highlight initially
    customMarker?: { lat: number; lng: number; label?: string } | null;
    onLocationClick?: (locationId: string, location?: LocationWithRelations) => void;
    onMapClick?: (coords: { lat: number; lng: number }) => void;
    onPoiClick?: (poi: { name: string; address?: string; lat: number; lng: number }) => void;
    onMapMove?: (center: { lat: number; lng: number; zoom: number }) => void;
    drawingPreview?: {
        type: 'Point' | 'LineString' | 'Polygon';
        coordinates: any;
    } | null;
}

export default function AdminMapClient({
    locations,
    tenantId,
    tenantSlug,
    checkIns,
    mapCenter,
    mapZoom = 15,
    minimal = false,
    className,
    highlightLocationId,
    customMarker,
    onLocationClick,
    onMapClick,
    onPoiClick,
    onMapMove,
    drawingPreview,
}: AdminMapClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [dialogLocationType, setDialogLocationType] = useState<any>(null); // Simplified type for now

    // Check for URL params to open edit dialog
    useEffect(() => {
        const locationIdParam = searchParams.get('locationId');
        const editParam = searchParams.get('edit');

        if (locationIdParam && editParam === 'true') {
            const loc = locations.find(l => l.id === locationIdParam);
            if (loc) {
                setSelectedLocation(loc);
                setDialogMode('edit');
                setDialogLocationType(loc.type as any);
                setIsDialogOpen(true);
            }
        }
    }, [searchParams, locations]);

    // Handler for saving location from dialog
    const handleSaveLocation = async (data: any) => {
        try {
            if (dialogMode === 'create') {
                // Logic to create location
                // Note: createLocation action needs to be imported or handled similarly to how sidebar did it
                // For now, assuming standard action call
                // The sidebar didn't have the implementation inside AdminMapClient, it was passed down or self-contained?
                // Wait, previous file analysis showed usage of EditSidebar but I didn't see the implementation of handlers in the snippet I read.
                // Let's implement robust handlers here.
                await createLocation(data, `/t/${tenantSlug}/admin/map`);
                toast.success("Location created successfully");
            } else {
                // Update
                if (data.id && data.tenant_id) {
                    await updateLocation(data.id, data, `/t/${tenantSlug}/admin/map`);
                    toast.success("Location updated successfully");
                }
            }
            setIsDialogOpen(false);
            // Clear URL params if exists
            if (searchParams.get('edit')) {
                const url = new URL(window.location.href);
                url.searchParams.delete('edit');
                url.searchParams.delete('locationId');
                window.history.pushState({}, "", url.toString());
            }

        } catch (error) {
            console.error("Error saving location:", error);
            toast.error("Failed to save location");
        }
    }

    const handleDeleteLocation = async (id: string) => {
        try {
            await deleteLocation(id, tenantId, `/t/${tenantSlug}/admin/map`);
            toast.success("Location deleted");
            setIsDialogOpen(false);
            if (searchParams.get('edit')) {
                const url = new URL(window.location.href);
                url.searchParams.delete('edit');
                url.searchParams.delete('locationId');
                window.history.pushState({}, "", url.toString());
            }
        } catch (error) {
            console.error("Error deleting location:", error);
            toast.error("Failed to delete location");
        }
    }

    // ... rest of existing code ...
    // Calculate initial center - prioritize boundary center, then mapCenter prop, then default
    const initialCenter = useMemo(() => {
        const boundary = locations.find(loc => loc.type === 'boundary');
        if (boundary?.boundary_coordinates && boundary.boundary_coordinates.length > 0) {
            const lats = boundary.boundary_coordinates.map(([lat]) => lat);
            const lngs = boundary.boundary_coordinates.map(([, lng]) => lng);
            return {
                latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
                longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
                zoom: 16 // Closer zoom for community focus
            };
        }
        return {
            latitude: mapCenter?.lat || 9.9567,
            longitude: mapCenter?.lng || -84.5333,
            zoom: mapZoom
        };
    }, [locations, mapCenter, mapZoom]);

    const [viewState, setViewState] = useState({
        longitude: initialCenter.longitude,
        latitude: initialCenter.latitude,
        zoom: initialCenter.zoom,
        pitch: 0,
        bearing: 0,
    });

    // Map state - declare before callbacks that use them
    const [hoveredLot, setHoveredLot] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<LocationWithRelations | CheckInWithRelations | null>(null);
    const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-streets-v12');
    const [currentZoom, setCurrentZoom] = useState(viewState.zoom);
    const mapRef = useRef<MapRef>(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<LocationWithRelations[]>([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [highlightedCategories, setHighlightedCategories] = useState<Set<string>>(new Set());

    // Auto-focus map on location selection
    const focusOnLocation = useCallback((location: LocationWithRelations | CheckInWithRelations) => {
        if (!mapRef.current) return;

        let coords: { lat: number; lng: number } | null = null;

        // Check if this is a check-in with displayCoords
        if ((location as any).displayCoords) {
            coords = (location as any).displayCoords || null;
        }
        // Get coordinates based on location type
        else if ('coordinates' in location && location.coordinates) {
            coords = location.coordinates as { lat: number; lng: number };
        } else if ((location as LocationWithRelations).boundary_coordinates && (location as LocationWithRelations).boundary_coordinates!.length > 0) {
            // For boundaries/polygons, use center
            const lats = (location as LocationWithRelations).boundary_coordinates!.map(([lat]: [number, number]) => lat);
            const lngs = (location as LocationWithRelations).boundary_coordinates!.map(([, lng]: [number, number]) => lng);
            coords = {
                lat: (Math.min(...lats) + Math.max(...lats)) / 2,
                lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
            };
        }

        if (coords) {
            mapRef.current.flyTo({
                center: [coords.lng, coords.lat],
                zoom: Math.max(currentZoom, 16), // Zoom in closer
                duration: 1000,
            });
        }
    }, [currentZoom]);

    // Effect to fly to mapCenter prop changes
    useEffect(() => {
        if (mapCenter && mapRef.current) {
            mapRef.current.flyTo({
                center: [mapCenter.lng, mapCenter.lat],
                zoom: mapZoom, // Use the passed zoom level
                duration: 1000,
            });
        }
    }, [mapCenter, mapZoom]);

    // Collapsible panel state
    const [showLayersPanel, setShowLayersPanel] = useState(false);
    const [showBaseMapPanel, setShowBaseMapPanel] = useState(false);

    // Layer visibility toggles
    const [showBoundary, setShowBoundary] = useState(true);
    const [showLots, setShowLots] = useState(true);
    const [showFacilities, setShowFacilities] = useState(true);
    const [showStreets, setShowStreets] = useState(true);
    const [showPaths, setShowPaths] = useState(true);
    const [showCheckIns, setShowCheckIns] = useState(true);

    // Prepare GeoJSON for boundary
    const boundaryGeoJSON = useMemo(() => {
        const boundary = locations.find(loc => loc.type === 'boundary');
        if (!boundary?.boundary_coordinates) return null;

        return {
            type: 'Feature' as const,
            geometry: {
                type: 'Polygon' as const,
                coordinates: [boundary.boundary_coordinates.map(([lat, lng]) => [lng, lat])],
            },
            properties: {
                id: boundary.id,
                name: boundary.name,
            },
        };
    }, [locations]);

    // Create inverse mask - a world polygon with boundary as a hole
    const inverseMaskGeoJSON = useMemo(() => {
        const boundary = locations.find(loc => loc.type === 'boundary');
        if (!boundary?.boundary_coordinates) return null;

        // World bounding box coordinates
        const worldBounds = [
            [-180, -90],
            [180, -90],
            [180, 90],
            [-180, 90],
            [-180, -90],
        ];

        // Boundary coordinates (already in [lng, lat] from boundaryGeoJSON logic)
        const boundaryCords = boundary.boundary_coordinates.map(([lat, lng]) => [lng, lat]);

        return {
            type: 'Feature' as const,
            geometry: {
                type: 'Polygon' as const,
                // First ring is the world, second ring is the boundary hole
                coordinates: [worldBounds, boundaryCords],
            },
            properties: {},
        };
    }, [locations]);

    // Prepare GeoJSON for lots (using path_coordinates where the polygon data actually is)
    const lotsGeoJSON = useMemo(() => {
        const features = locations
            .filter(loc => loc.type === 'lot' && loc.path_coordinates && loc.path_coordinates.length > 0)
            .map(lot => ({
                type: 'Feature' as const,
                geometry: {
                    type: 'Polygon' as const,
                    // path_coordinates is where lot boundaries are stored
                    // Convert from [lat, lng] to [lng, lat] for Mapbox
                    coordinates: [lot.path_coordinates!.map(([lat, lng]) => [lng, lat])],
                },
                properties: {
                    id: lot.id,
                    name: lot.name,
                    neighborhood: lot.neighborhood?.name,
                },
            }));

        console.log('[Mapbox] Rendered', features.length, 'lot polygons');
        return {
            type: 'FeatureCollection' as const,
            features,
        };
    }, [locations]);

    // Calculate lot label positions using Turf (only for lots with proper names)
    const lotLabelsGeoJSON = useMemo(() => {
        const features = lotsGeoJSON.features
            .filter(feature => {
                const name = feature.properties.name;
                // Only show labels for lots with proper names (not "Imported LineString")
                return name && !name.toLowerCase().includes('imported') && !name.toLowerCase().includes('linestring');
            })
            .map(feature => {
                const centroid = turf.centroid(feature);
                return {
                    type: 'Feature' as const,
                    geometry: centroid.geometry,
                    properties: feature.properties,
                };
            });

        return {
            type: 'FeatureCollection' as const,
            features,
        };
    }, [lotsGeoJSON]);

    // Prepare GeoJSON for facilities (using path_coordinates for polygon areas)
    const facilitiesGeoJSON = useMemo(() => {
        const features = locations
            .filter(loc => loc.type === 'facility' && loc.path_coordinates && loc.path_coordinates.length > 0)
            .map(fac => ({
                type: 'Feature' as const,
                geometry: {
                    type: 'Polygon' as const,
                    // Convert from [lat, lng] to [lng, lat] for Mapbox
                    coordinates: [fac.path_coordinates!.map(([lat, lng]) => [lng, lat])],
                },
                properties: {
                    id: fac.id,
                    name: fac.name,
                    facility_type: fac.facility_type,
                    icon: fac.icon || '🏛️',
                },
            }));

        console.log('[Mapbox] Rendered', features.length, 'facility polygons');
        return {
            type: 'FeatureCollection' as const,
            features,
        };
    }, [locations]);

    // Prepare GeoJSON for streets
    const streetsGeoJSON = useMemo(() => {
        const features = locations
            .filter(loc => loc.type === 'public_street' && loc.path_coordinates)
            .map(street => ({
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: street.path_coordinates!.map(([lat, lng]) => [lng, lat]),
                },
                properties: {
                    id: street.id,
                    name: street.name,
                },
            }));

        return {
            type: 'FeatureCollection' as const,
            features,
        };
    }, [locations]);

    // Prepare GeoJSON for walking paths
    const pathsGeoJSON = useMemo(() => {
        const features = locations
            .filter(loc => loc.type === 'walking_path' && loc.path_coordinates)
            .map(path => ({
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: path.path_coordinates!.map(([lat, lng]) => [lng, lat]),
                },
                properties: {
                    id: path.id,
                    name: path.name,
                },
            }));

        return {
            type: 'FeatureCollection' as const,
            features,
        };
    }, [locations]);

    // Filter and distribute check-ins - only show LIVE/ACTIVE ones
    const distributedCheckIns = useMemo(() => {
        const now = Date.now();

        // First filter to only LIVE check-ins
        const liveCheckIns = checkIns.filter((checkIn: any) => {
            const startTime = new Date(checkIn.start_time).getTime();
            const durationMs = checkIn.duration_minutes * 60 * 1000;
            const endTime = startTime + durationMs;
            return endTime > now; // Only show if hasn't expired
        });

        console.log(`[Mapbox] Filtered ${checkIns.length} check-ins down to ${liveCheckIns.length} live ones`);

        return liveCheckIns.map((checkIn: any) => {
            // Extract coordinates based on location type
            let coords = null;

            if (checkIn.location_type === 'community_location') {
                // Get from linked location
                coords = checkIn.location?.coordinates;
            } else if (checkIn.location_type === 'custom_temporary') {
                // custom_location_coordinates is already an object {lat, lng}
                coords = checkIn.custom_location_coordinates;
            }

            if (!coords || !coords.lat || !coords.lng) {
                console.warn('[Mapbox] No valid coordinates for check-in:', checkIn.id, checkIn);
                return null;
            }

            // Find all check-ins at roughly the same location
            const sameLocation = liveCheckIns.filter((ci: any) => {
                let ciCoords = null;
                if (ci.location_type === 'community_location') {
                    ciCoords = ci.location?.coordinates;
                } else if (ci.location_type === 'custom_temporary') {
                    ciCoords = ci.custom_location_coordinates;
                }
                if (!ciCoords) return false;
                return (
                    Math.abs(ciCoords.lat - coords.lat) < 0.0001 &&
                    Math.abs(ciCoords.lng - coords.lng) < 0.0001
                );
            });

            console.log(`[Mapbox] Check-in ${checkIn.id} - ${sameLocation.length} at same location`);

            // If only one check-in at this location, use exact coordinates
            if (sameLocation.length === 1) {
                return {
                    ...checkIn,
                    displayCoords: coords,
                };
            }

            // Otherwise distribute in a circle
            const ciIndex = sameLocation.findIndex((ci: any) => ci.id === checkIn.id);
            const angle = (ciIndex / sameLocation.length) * 2 * Math.PI;
            const radius = 0.00008; // ~8 meters
            const distributed = {
                lat: coords.lat + radius * Math.cos(angle),
                lng: coords.lng + radius * Math.sin(angle),
            };

            console.log(`[Mapbox] Distributing check-in ${checkIn.id} (${ciIndex + 1}/${sameLocation.length}):`, distributed);

            return {
                ...checkIn,
                displayCoords: distributed,
            };
        }).filter(Boolean) as any[];
    }, [checkIns]);

    // Search locations as user types
    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase();
            const results = locations.filter(loc =>
                loc.name.toLowerCase().includes(query) ||
                loc.type.toLowerCase().includes(query) ||
                loc.neighborhood?.name?.toLowerCase().includes(query)
            ).slice(0, 10); // Limit to 10 results
            setSearchResults(results);
            setShowSearchDropdown(true);
        } else {
            setSearchResults([]);
            setShowSearchDropdown(false);
        }
    }, [searchQuery, locations]);

    // State for dynamic check-in timer
    const [remainingTime, setRemainingTime] = useState<number | null>(null);

    // Effect for check-in timer
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (selectedLocation && (selectedLocation as CheckInWithRelations).start_time && (selectedLocation as CheckInWithRelations).duration_minutes) {
            const checkIn = selectedLocation as CheckInWithRelations;
            const startTime = new Date(checkIn.start_time!).getTime();
            const durationMs = checkIn.duration_minutes! * 60 * 1000;
            const endTime = startTime + durationMs;

            const updateRemainingTime = () => {
                const now = Date.now();
                const timeRemaining = endTime - now;
                setRemainingTime(timeRemaining > 0 ? timeRemaining : 0);
            };

            updateRemainingTime(); // Initial calculation
            timer = setInterval(updateRemainingTime, 1000); // Update every second
        } else {
            setRemainingTime(null); // Clear timer if no check-in selected or no duration
        }

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [selectedLocation]);


    // Category buttons configuration
    const categoryButtons = useMemo(() => [
        {
            id: 'boundary',
            label: 'Boundary',
            icon: '🗺️',
            count: locations.filter(l => l.type === 'boundary').length,
            type: 'boundary'
        },
        {
            id: 'lots',
            label: 'Lots',
            icon: '🏡',
            count: locations.filter(l => l.type === 'lot').length,
            type: 'lot'
        },
        {
            id: 'facilities',
            label: 'Facilities',
            icon: '🏛️',
            count: locations.filter(l => l.type === 'facility').length,
            type: 'facility'
        },
        {
            id: 'streets',
            label: 'Streets',
            icon: '🛣️',
            count: locations.filter(l => l.type === 'public_street').length,
            type: 'public_street'
        },
        {
            id: 'paths',
            label: 'Paths',
            icon: '🚶',
            count: locations.filter(l => l.type === 'walking_path').length,
            type: 'walking_path'
        },
        {
            id: 'checkins',
            label: 'Check-ins',
            icon: '📍',
            count: distributedCheckIns.length,
            type: 'checkin'
        },
    ], [locations, distributedCheckIns]);

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50">
                <Card className="p-6">
                    <p className="text-red-600">❌ Mapbox token not found in environment variables</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className={`relative h-full w-full flex flex-col overflow-hidden ${className || ''}`}>
            {/* Top Bar - Search + Category Filters (hide in minimal mode) */}
            {!minimal && (
                <div className="relative z-20 bg-background dark:bg-card border-b border-border px-4 py-3">
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
                                <div className="absolute top-full left-0 right-0 mt-1 bg-background dark:bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto z-30">
                                    {searchResults.map((location) => (
                                        <button
                                            key={location.id}
                                            className="w-full text-left px-4 py-2 hover:bg-muted/50 dark:hover:bg-muted border-b border-border last:border-b-0 transition-colors"
                                            onClick={() => {
                                                setSelectedLocation(location);
                                                setSearchQuery('');
                                                setShowSearchDropdown(false);
                                                focusOnLocation(location);
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

                        {/* Category Filter Buttons - Hide in minimal mode */}
                        {!minimal && (
                            <div className="flex items-center gap-2">
                                {categoryButtons.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => {
                                            const newHighlighted = new Set(highlightedCategories);
                                            if (newHighlighted.has(category.type)) {
                                                newHighlighted.delete(category.type);
                                            } else {
                                                newHighlighted.add(category.type);
                                            }
                                            setHighlightedCategories(newHighlighted);
                                        }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${highlightedCategories.has(category.type)
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'bg-background dark:bg-card hover:bg-muted/50 dark:hover:bg-muted border-border'
                                            }`}
                                        disabled={category.count === 0}
                                    >
                                        <span className="text-lg">{category.icon}</span>
                                        <span className="text-sm font-medium">{category.label}</span>
                                        <Badge
                                            variant={highlightedCategories.has(category.type) ? 'secondary' : 'outline'}
                                            className="ml-1 text-xs"
                                        >
                                            {category.count}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Content Area - Map + Sidebar */}
            <div className="relative flex-1 flex overflow-hidden">
                {/* Map Container - Responsive width based on selection */}
                <div
                    className={`relative h-full transition-all duration-300 ease-in-out ${!minimal && (selectedLocation || highlightedCategories.size > 0) ? 'w-2/3' : 'w-full'
                        }`}
                >
                    <Map
                        {...viewState}
                        style={{ width: '100%', height: '100%' }}
                        mapStyle={mapStyle}
                        mapboxAccessToken={mapboxToken}
                        onMove={evt => {
                            setViewState(evt.viewState);
                            setCurrentZoom(evt.viewState.zoom);
                            if (onMapMove) {
                                onMapMove({
                                    lat: evt.viewState.latitude,
                                    lng: evt.viewState.longitude,
                                    zoom: evt.viewState.zoom
                                });
                            }
                        }}
                        ref={mapRef}
                        interactiveLayerIds={['lots-fill', 'facilities-fill', 'poi-label']}
                        onClick={(e: any) => {
                            if (e.features && e.features.length > 0) {
                                const feature = e.features[0];

                                // Handle Community Location Click
                                if (feature.layer.id === 'lots-fill' || feature.layer.id === 'facilities-fill') {
                                    const locationId = feature.properties.id;
                                    const location = locations.find(loc => loc.id === locationId);
                                    if (location) {
                                        // Call external callback if provided (minimal mode)
                                        if (onLocationClick) {
                                            onLocationClick(locationId, location);
                                        }
                                        // Set internal state (full mode)
                                        if (!minimal) {
                                            setSelectedLocation(location);
                                        }
                                    }
                                }
                                // Handle POI Click
                                else if (feature.layer.id === 'poi-label' && onPoiClick) {
                                    const name = feature.properties.name || 'Unknown Location';
                                    // Construct address from available properties if possible, otherwise undefined
                                    // Mapbox vector tiles often have 'address' or 'type' properties
                                    const address = feature.properties.address;

                                    onPoiClick({
                                        name,
                                        address,
                                        lat: e.lngLat.lat,
                                        lng: e.lngLat.lng
                                    });
                                }
                            } else {
                                if (!minimal) {
                                    setSelectedLocation(null);
                                }
                                // Handle background click (for pin dropping)
                                if (onMapClick) {
                                    onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
                                }
                            }
                        }}
                        onMouseEnter={useCallback((e: any) => {
                            if (e.features && e.features.length > 0) {
                                setHoveredLot(e.features[0].properties.id);
                            }
                        }, [])}
                        onMouseLeave={useCallback(() => setHoveredLot(null), [])}
                        cursor={hoveredLot ? 'pointer' : 'grab'}
                        terrain={mapStyle === 'mapbox://styles/mapbox/satellite-streets-v12' && viewState.pitch > 0 ? { source: 'mapbox-dem', exaggeration: 1.5 } : undefined}
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
                                        'line-color': '#D97742', // Sunrise Orange
                                        'line-width': 3,
                                        'line-opacity': 0.9,
                                    }}
                                />
                            </Source>
                        )}

                        {/* Lots - Fill */}
                        {showLots && (
                            <Source id="lots" type="geojson" data={lotsGeoJSON}>
                                <Layer
                                    id="lots-fill"
                                    type="fill"
                                    paint={{
                                        'fill-color': '#86B25C',
                                        'fill-opacity': 0.3,
                                    }}
                                />

                                {/* Lots - Border */}
                                <Layer
                                    id="lots-border"
                                    type="line"
                                    paint={{
                                        'line-color': [
                                            'case',
                                            ['boolean', ['feature-state', 'selected'], false],
                                            '#F97316', // Orange when individually selected
                                            ['==', ['get', 'id'], minimal ? (highlightLocationId || '') : (selectedLocation?.id || '')],
                                            '#F97316', // Orange when ID matches
                                            highlightedCategories.has('lot') ? '#F97316' : '#2D5016', // Orange when category highlighted
                                        ],
                                        'line-width': [
                                            'case',
                                            ['==', ['get', 'id'], minimal ? (highlightLocationId || '') : (selectedLocation?.id || '')],
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
                                        'text-field': ['get', 'name'],
                                        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                                        'text-size': 11,
                                        'text-anchor': 'center',
                                    }}
                                    paint={{
                                        'text-color': '#059669',
                                        'text-halo-color': '#FFFFFF',
                                        'text-halo-width': 1.5,
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
                                        'fill-color': '#3B82F6',
                                        'fill-opacity': 0.2,
                                    }}
                                />

                                {/* Facility Border */}
                                <Layer
                                    id="facilities-border"
                                    type="line"
                                    paint={{
                                        'line-color': [
                                            'case',
                                            ['boolean', ['feature-state', 'selected'], false],
                                            '#F97316', // Orange when individually selected
                                            ['==', ['get', 'id'], minimal ? (highlightLocationId || '') : (selectedLocation?.id || '')],
                                            '#F97316', // Orange when ID matches
                                            highlightedCategories.has('facility') ? '#F97316' : '#1E40AF', // Orange when category highlighted
                                        ],
                                        'line-width': [
                                            'case',
                                            ['==', ['get', 'id'], minimal ? (highlightLocationId || '') : (selectedLocation?.id || '')],
                                            3, // Thicker orange border for selected
                                            2, // Normal width
                                        ],
                                    }}
                                />

                                {/* Facility Labels (at centroid) */}
                                <Layer
                                    id="facility-labels"
                                    type="symbol"
                                    minzoom={14} // Only show labels when zoomed in
                                    layout={{
                                        'text-field': ['get', 'name'],
                                        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                                        'text-size': 12,
                                        'symbol-placement': 'point',
                                    }}
                                    paint={{
                                        'text-color': '#1D4ED8',
                                        'text-halo-color': '#FFFFFF',
                                        'text-halo-width': 2,
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
                                        if (!minimal) {
                                            setSelectedLocation(location);
                                        }
                                        focusOnLocation(location);
                                    }}
                                >
                                    <div className={`cursor-pointer transform transition-transform hover:scale-110 ${isHighlighted ? 'scale-110' : ''}`}>
                                        {isHighlighted && (
                                            <div className="absolute -inset-2 rounded-full border-2 border-[#F97316] animate-pulse opacity-70"></div>
                                        )}
                                        <div className={`bg-background dark:bg-card p-1.5 rounded-full shadow-md border ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-border'} text-xl flex items-center justify-center w-10 h-10`}>
                                            {location.icon || '🏛️'}
                                        </div>
                                    </div>
                                </Marker>
                            );
                        })}

                        {/* Custom Marker */}
                        {customMarker && (
                            <Marker
                                latitude={customMarker.lat}
                                longitude={customMarker.lng}
                                anchor="bottom"
                            >
                                <div className="flex flex-col items-center">
                                    <div className="bg-background dark:bg-card px-2 py-1 rounded shadow text-xs font-medium mb-1 whitespace-nowrap">
                                        {customMarker.label || 'Custom Location'}
                                    </div>
                                    <MapPin className="h-8 w-8 text-primary fill-current" />
                                </div>
                            </Marker>
                        )}

                        {/* Drawing Preview - Point as Marker */}
                        {drawingPreview && drawingPreview.type === 'Point' && (
                            <Marker
                                latitude={drawingPreview.coordinates[1]}
                                longitude={drawingPreview.coordinates[0]}
                                anchor="center"
                            >
                                <div className="relative">
                                    <div className="h-4 w-4 rounded-full bg-[#F97316] border-2 border-white shadow-lg" />
                                </div>
                            </Marker>
                        )}

                        {/* Drawing Preview - Lines and Polygons as Source/Layers */}
                        {drawingPreview && (drawingPreview.type === 'LineString' || drawingPreview.type === 'Polygon') && (
                            <Source
                                id="drawing-preview"
                                type="geojson"
                                data={{
                                    type: 'FeatureCollection',
                                    features: [
                                        {
                                            type: 'Feature',
                                            geometry: {
                                                type: drawingPreview.type,
                                                coordinates: drawingPreview.coordinates,
                                            },
                                            properties: {},
                                        },
                                    ],
                                }}
                            >
                                {/* LineString - Line */}
                                {drawingPreview.type === 'LineString' && (
                                    <Layer
                                        id="drawing-preview-line"
                                        type="line"
                                        source="drawing-preview"
                                        paint={{
                                            'line-color': '#F97316',
                                            'line-width': 3,
                                            'line-opacity': 0.8,
                                        }}
                                    />
                                )}

                                {/* LineString - Vertices */}
                                {drawingPreview.type === 'LineString' && (
                                    <Layer
                                        id="drawing-preview-line-vertices"
                                        type="circle"
                                        source="drawing-preview"
                                        paint={{
                                            'circle-radius': 5,
                                            'circle-color': '#ffffff',
                                            'circle-stroke-width': 2,
                                            'circle-stroke-color': '#F97316',
                                        }}
                                    />
                                )}

                                {/* Polygon - Fill */}
                                {drawingPreview.type === 'Polygon' && (
                                    <Layer
                                        id="drawing-preview-polygon-fill"
                                        type="fill"
                                        source="drawing-preview"
                                        paint={{
                                            'fill-color': '#F97316',
                                            'fill-opacity': 0.2,
                                        }}
                                    />
                                )}

                                {/* Polygon - Outline */}
                                {drawingPreview.type === 'Polygon' && (
                                    <Layer
                                        id="drawing-preview-polygon-outline"
                                        type="line"
                                        source="drawing-preview"
                                        paint={{
                                            'line-color': '#F97316',
                                            'line-width': 3,
                                            'line-opacity': 0.8,
                                        }}
                                    />
                                )}

                                {/* Polygon - Vertices */}
                                {drawingPreview.type === 'Polygon' && (
                                    <Layer
                                        id="drawing-preview-polygon-vertices"
                                        type="circle"
                                        source="drawing-preview"
                                        paint={{
                                            'circle-radius': 5,
                                            'circle-color': '#ffffff',
                                            'circle-stroke-width': 2,
                                            'circle-stroke-color': '#F97316',
                                        }}
                                    />
                                )}
                            </Source>
                        )}

                        {/* Public Streets */}
                        {showStreets && streetsGeoJSON.features.length > 0 && (
                            <Source id="streets" type="geojson" data={streetsGeoJSON}>
                                <Layer
                                    id="streets"
                                    type="line"
                                    paint={{
                                        'line-color': highlightedCategories.has('public_street') ? '#F97316' : '#8C8C8C', // Orange when highlighted
                                        'line-width': highlightedCategories.has('public_street') ? 4 : 3,
                                        'line-dasharray': [2, 2],
                                    }}
                                />
                            </Source>
                        )}

                        {/* Walking Paths */}
                        {showPaths && pathsGeoJSON.features.length > 0 && (
                            <Source id="paths" type="geojson" data={pathsGeoJSON}>
                                <Layer
                                    id="paths"
                                    type="line"
                                    paint={{
                                        'line-color': highlightedCategories.has('walking_path') ? '#F97316' : '#6B9B47', // Orange when highlighted
                                        'line-width': highlightedCategories.has('walking_path') ? 3 : 2,
                                        'line-dasharray': [3, 3],
                                    }}
                                />
                            </Source>
                        )}

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
                                                    src={checkIn.creator?.profile_picture_url || '/default-avatar.png'}
                                                    alt={checkIn.creator?.first_name}
                                                    className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-lg transition-transform group-hover:scale-110"
                                                />
                                                {/* Pulse animation */}
                                                <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary opacity-75" />
                                            </div>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white group-hover:block">
                                                {checkIn.creator?.first_name}
                                                {checkIn.location?.name && ` @ ${checkIn.location.name}`}
                                            </div>
                                        </div>
                                    </Marker>
                                );
                            })}

                        {/* Map Controls */}
                        {/* Map Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                            <NavigationControl showCompass={true} showZoom={true} />
                            <GeolocateControl />
                            {/* Reset Camera Button */}
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-[29px] w-[29px] rounded-md bg-background dark:bg-card shadow-md hover:bg-muted/50 dark:hover:bg-muted"
                                onClick={() => {
                                    mapRef.current?.flyTo({
                                        pitch: 0,
                                        bearing: 0,
                                        duration: 1000
                                    });
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
                    </Map>

                    {/* Collapsible Layer Toggle Button - Matches Mapbox Control Style */}
                    <div className="absolute left-4 top-4 z-10">
                        <button
                            onClick={() => {
                                setShowLayersPanel(!showLayersPanel);
                                if (!showLayersPanel) setShowBaseMapPanel(false); // Close other panel
                            }}
                            className="mapboxgl-ctrl mapboxgl-ctrl-group"
                            title="Toggle Layers"
                            style={{
                                width: '29px',
                                height: '29px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'white',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ color: '#333' }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                />
                            </svg>
                        </button>

                        {/* Expandable Layers Panel */}
                        {showLayersPanel && (
                            <div className="mt-2 rounded-lg border border-border bg-background dark:bg-card p-4 shadow-lg w-56">
                                <h3 className="mb-3 font-semibold text-sm">Map Layers</h3>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={showBoundary}
                                            onChange={e => setShowBoundary(e.target.checked)}
                                            className="rounded"
                                        />
                                        Community Boundary
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={showLots}
                                            onChange={e => setShowLots(e.target.checked)}
                                            className="rounded"
                                        />
                                        Lots ({lotsGeoJSON.features.length})
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={showFacilities}
                                            onChange={e => setShowFacilities(e.target.checked)}
                                            className="rounded"
                                        />
                                        Facilities ({facilitiesGeoJSON.features.length})
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={showStreets}
                                            onChange={e => setShowStreets(e.target.checked)}
                                            className="rounded"
                                        />
                                        Streets ({streetsGeoJSON.features.length})
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={showPaths}
                                            onChange={e => setShowPaths(e.target.checked)}
                                            className="rounded"
                                        />
                                        Walking Paths ({pathsGeoJSON.features.length})
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={showCheckIns}
                                            onChange={e => setShowCheckIns(e.target.checked)}
                                            className="rounded"
                                        />
                                        Check-ins ({distributedCheckIns.length})
                                    </label>

                                    <div className="pt-2 mt-2 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start gap-2 mb-2"
                                            onClick={() => {
                                                // Redirect to editor
                                                // Assuming there's a route for editing, or we use the old one for now
                                                window.location.href = `/t/${tenantSlug}/admin/map/create`;
                                            }}
                                        >
                                            <Edit className="h-3 w-3" />
                                            Edit Map Data
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start gap-2"
                                            onClick={() => {
                                                // Export GeoJSON
                                                const collection = {
                                                    type: 'FeatureCollection',
                                                    features: [
                                                        ...lotsGeoJSON.features,
                                                        ...facilitiesGeoJSON.features,
                                                        ...streetsGeoJSON.features,
                                                        ...pathsGeoJSON.features,
                                                        ...(boundaryGeoJSON ? [boundaryGeoJSON] : [])
                                                    ]
                                                };
                                                const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `community-map-${tenantSlug}.geojson`;
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                                URL.revokeObjectURL(url);
                                            }}
                                        >
                                            <Download className="h-3 w-3" />
                                            Export GeoJSON
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Collapsible Base Map Button - Top Left next to Filter */}
                    <div className="absolute left-16 top-4 z-10">
                        <button
                            onClick={() => {
                                setShowBaseMapPanel(!showBaseMapPanel);
                                if (!showBaseMapPanel) setShowLayersPanel(false); // Close other panel
                            }}
                            className="mapboxgl-ctrl mapboxgl-ctrl-group"
                            title="Change Base Map"
                            style={{
                                width: '29px',
                                height: '29px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'white',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ color: '#333' }}
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
                            <div className="mt-2 rounded-lg border border-border bg-background dark:bg-card p-4 shadow-lg w-64">
                                <h4 className="mb-3 text-sm font-semibold">Base Map</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            setMapStyle('mapbox://styles/mapbox/satellite-streets-v12');
                                            // Reset to 2D view
                                            mapRef.current?.flyTo({
                                                pitch: 0,
                                                bearing: 0,
                                                duration: 1000
                                            });
                                        }}
                                        className={`px-3 py-2 text-xs rounded-md border transition-colors ${mapStyle === 'mapbox://styles/mapbox/satellite-streets-v12' && viewState.pitch <= 60
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white hover:bg-gray-50 border-gray-300'
                                            }`}
                                    >
                                        Satellite
                                    </button>
                                    <button
                                        onClick={() => setMapStyle('mapbox://styles/mapbox/streets-v12')}
                                        className={`px-3 py-2 text-xs rounded-md border transition-colors ${mapStyle === 'mapbox://styles/mapbox/streets-v12'
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white hover:bg-gray-50 border-gray-300'
                                            }`}
                                    >
                                        Streets
                                    </button>
                                    <button
                                        onClick={() => setMapStyle('mapbox://styles/mapbox/outdoors-v12')}
                                        className={`px-3 py-2 text-xs rounded-md border transition-colors ${mapStyle === 'mapbox://styles/mapbox/outdoors-v12'
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white hover:bg-gray-50 border-gray-300'
                                            }`}
                                    >
                                        Outdoors
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMapStyle('mapbox://styles/mapbox/satellite-streets-v12');
                                            // Fly to high pitch for 3D effect
                                            mapRef.current?.flyTo({
                                                pitch: 80,
                                                zoom: 16,
                                                duration: 2000
                                            });
                                        }}
                                        className={`px-3 py-2 text-xs rounded-md border transition-colors ${mapStyle === 'mapbox://styles/mapbox/satellite-streets-v12' && (viewState.pitch > 60)
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white hover:bg-gray-50 border-gray-300'
                                            }`}
                                    >
                                        3D Terrain
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Sidebar - Shows single selection OR category list (hide in minimal mode) */}
                {!minimal && (
                    <div
                        className={`relative h-full bg-background dark:bg-card border-l border-border transition-all duration-300 ease-in-out overflow-y-auto ${(selectedLocation || highlightedCategories.size > 0) ? 'w-1/3' : 'w-0'
                            }`}
                    >
                        {/* Single Location View */}
                        {selectedLocation && (
                            <div className="p-6">
                                {/* Check if this is a check-in */}
                                {(selectedLocation as CheckInWithRelations).activity_type ? (
                                    /* Check-in Card */
                                    <>
                                        {/* Header with Close Button */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h2 className="font-semibold text-2xl mb-2">
                                                    {(selectedLocation as CheckInWithRelations).title || 'Check-in'}
                                                </h2>
                                                <Badge variant="secondary" className="capitalize">
                                                    {(selectedLocation as CheckInWithRelations).activity_type}
                                                </Badge>
                                            </div>
                                            <button
                                                onClick={() => setSelectedLocation(null)}
                                                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                                                title="Close"
                                            >
                                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* User Info */}
                                        {(selectedLocation as CheckInWithRelations).creator && (
                                            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                                <img
                                                    src={(selectedLocation as CheckInWithRelations).creator?.profile_picture_url || '/default-avatar.png'}
                                                    alt={(selectedLocation as CheckInWithRelations).creator?.first_name}
                                                    className="h-12 w-12 rounded-full object-cover border-2 border-white shadow"
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {(selectedLocation as CheckInWithRelations).creator?.first_name} {(selectedLocation as CheckInWithRelations).creator?.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">Checked in</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Location */}
                                        {(selectedLocation as CheckInWithRelations).location?.name && (
                                            <div className="mb-3">
                                                <span className="text-sm font-medium text-gray-500">Location</span>
                                                <p className="text-gray-900">{(selectedLocation as CheckInWithRelations).location?.name}</p>
                                            </div>
                                        )}
                                        {(selectedLocation as CheckInWithRelations).custom_location_name && (
                                            <div className="mb-3">
                                                <span className="text-sm font-medium text-gray-500">Location</span>
                                                <p className="text-gray-900">{(selectedLocation as CheckInWithRelations).custom_location_name}</p>
                                            </div>
                                        )}

                                        {/* Time & Remaining Duration */}
                                        <div className="space-y-3 mb-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                {(selectedLocation as CheckInWithRelations).start_time && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-500">Started</span>
                                                        <p className="text-gray-900">
                                                            {new Date((selectedLocation as CheckInWithRelations).start_time!).toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </p>
                                                    </div>
                                                )}
                                                {(selectedLocation as CheckInWithRelations).duration_minutes && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-500">Duration</span>
                                                        <p className="text-gray-900">{(selectedLocation as CheckInWithRelations).duration_minutes} min</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Remaining Time Timer */}
                                            {remainingTime !== null && remainingTime > 0 && (
                                                <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Time Remaining</span>
                                                        <span className="text-lg font-bold text-primary">
                                                            {Math.floor(remainingTime / 60000)}:{Math.floor((remainingTime % 60000) / 1000).toString().padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {remainingTime !== null && remainingTime <= 0 && (
                                                <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Status</span>
                                                        <span className="text-lg font-bold text-gray-500">
                                                            Expired
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Description */}
                                        {(selectedLocation as CheckInWithRelations).description && (
                                            <div className="mb-4">
                                                <span className="text-sm font-medium text-gray-500">Message</span>
                                                <p className="text-gray-900 mt-1">{(selectedLocation as CheckInWithRelations).description}</p>
                                            </div>
                                        )}

                                        {/* Visibility */}
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span className="capitalize">{(selectedLocation as CheckInWithRelations).visibility_scope || 'community'}</span>
                                        </div>

                                        {/* RSVP Actions */}
                                        <div className="border-t pt-4 mt-2">
                                            <p className="text-sm font-medium text-gray-700 mb-3">Are you joining?</p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className={`flex-1 gap-2 ${(selectedLocation as any).user_rsvp_status === 'yes' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : ''}`}
                                                    onClick={async () => {
                                                        const checkIn = selectedLocation as CheckInWithRelations;
                                                        const newStatus = (checkIn as any).user_rsvp_status === 'yes' ? null : 'yes';

                                                        // Optimistic update
                                                        setSelectedLocation({
                                                            ...checkIn,
                                                            user_rsvp_status: newStatus
                                                        } as any);

                                                        try {
                                                            await rsvpToCheckIn(checkIn.id, tenantId, tenantSlug, newStatus === 'yes' ? 'yes' : 'no'); // API expects 'yes', 'maybe', 'no'. If toggling off, what to send? The action handles 'yes'|'maybe'|'no'. 
                                                            // Wait, the action takes "yes" | "maybe" | "no". Toggling off usually means removing RSVP or setting to 'no'? 
                                                            // PriorityFeed logic: const newStatus = currentStatus === status ? null : status
                                                            // apiStatus = newStatus === null ? "no" : ...
                                                            // So if null (toggled off), we send "no" or handle it. 
                                                            // Let's match PriorityFeed logic:
                                                            // if newStatus is null, send "no" (or maybe we need a remove endpoint? The action upserts. Sending 'no' is explicit 'not going'). 
                                                            // Actually, PriorityFeed sends "no" if newStatus is null.

                                                            const apiStatus = newStatus === null ? 'no' : 'yes';
                                                            await rsvpToCheckIn(checkIn.id, tenantId, tenantSlug, apiStatus);
                                                        } catch (error) {
                                                            console.error('Failed to RSVP:', error);
                                                            // Revert
                                                            setSelectedLocation(checkIn);
                                                        }
                                                    }}
                                                >
                                                    <Check className="h-4 w-4" />
                                                    Going
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className={`flex-1 gap-2 ${(selectedLocation as any).user_rsvp_status === 'maybe' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : ''}`}
                                                    onClick={async () => {
                                                        const checkIn = selectedLocation as CheckInWithRelations;
                                                        const newStatus = (checkIn as any).user_rsvp_status === 'maybe' ? null : 'maybe';

                                                        setSelectedLocation({
                                                            ...checkIn,
                                                            user_rsvp_status: newStatus
                                                        } as any);

                                                        try {
                                                            const apiStatus = newStatus === null ? 'no' : 'maybe';
                                                            await rsvpToCheckIn(checkIn.id, tenantId, tenantSlug, apiStatus);
                                                        } catch (error) {
                                                            console.error('Failed to RSVP:', error);
                                                            setSelectedLocation(checkIn);
                                                        }
                                                    }}
                                                >
                                                    <span className="font-bold text-sm">?</span>
                                                    Maybe
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className={`flex-1 gap-2 ${(selectedLocation as any).user_rsvp_status === 'no' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : ''}`}
                                                    onClick={async () => {
                                                        const checkIn = selectedLocation as CheckInWithRelations;
                                                        const newStatus = (checkIn as any).user_rsvp_status === 'no' ? null : 'no';

                                                        setSelectedLocation({
                                                            ...checkIn,
                                                            user_rsvp_status: newStatus
                                                        } as any);

                                                        try {
                                                            const apiStatus = 'no'; // Always no if clicking X
                                                            await rsvpToCheckIn(checkIn.id, tenantId, tenantSlug, apiStatus);
                                                        } catch (error) {
                                                            console.error('Failed to RSVP:', error);
                                                            setSelectedLocation(checkIn);
                                                        }
                                                    }}
                                                >
                                                    <span className="font-bold text-sm">✕</span>
                                                    Can't
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* Regular Location Card */
                                    /* Regular Location Card */
                                    <>
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h2 className="font-semibold text-2xl mb-2">{(selectedLocation as LocationWithRelations).name}</h2>
                                                <Badge variant="secondary" className="capitalize">
                                                    {(selectedLocation as LocationWithRelations).type}
                                                </Badge>
                                            </div>
                                            <button
                                                onClick={() => setSelectedLocation(null)}
                                                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                                                title="Close"
                                            >
                                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Hero Photo */}
                                        {((selectedLocation as any).hero_photo || ((selectedLocation as any).photos && (selectedLocation as any).photos.length > 0)) && (
                                            <div className="mb-4 rounded-lg overflow-hidden">
                                                <img
                                                    src={(selectedLocation as any).hero_photo || (selectedLocation as any).photos[0]}
                                                    alt={(selectedLocation as LocationWithRelations).name}
                                                    className="w-full h-48 object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Description */}
                                        {(selectedLocation as LocationWithRelations).description && (
                                            <p className="text-gray-600 mb-4">{(selectedLocation as LocationWithRelations).description}</p>
                                        )}

                                        {/* Details Grid */}
                                        <div className="space-y-3">
                                            {(selectedLocation as LocationWithRelations).neighborhood && (
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500">Neighborhood</span>
                                                    <p className="text-gray-900">{(selectedLocation as LocationWithRelations).neighborhood!.name}</p>
                                                </div>
                                            )}

                                            {(selectedLocation as LocationWithRelations).facility_type && (
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500">Type</span>
                                                    <p className="text-gray-900 capitalize">{(selectedLocation as LocationWithRelations).facility_type}</p>
                                                </div>
                                            )}

                                            {(selectedLocation as LocationWithRelations).hours && (
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500">Hours</span>
                                                    <p className="text-gray-900">{(selectedLocation as LocationWithRelations).hours}</p>
                                                </div>
                                            )}

                                            {/* Facility: Capacity, Parking, Accessibility */}
                                            {(selectedLocation as LocationWithRelations).type === 'facility' && (
                                                <>
                                                    {(selectedLocation as any).capacity && (
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-500">Capacity</span>
                                                            <p className="text-gray-900">{(selectedLocation as any).capacity} people</p>
                                                        </div>
                                                    )}
                                                    {(selectedLocation as any).parking_spaces && (
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-500">Parking</span>
                                                            <p className="text-gray-900">{(selectedLocation as any).parking_spaces} spaces</p>
                                                        </div>
                                                    )}
                                                    {(selectedLocation as any).accessibility_features && (selectedLocation as any).accessibility_features.length > 0 && (
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-500 block mb-2">Accessibility</span>
                                                            <div className="flex flex-wrap gap-1">
                                                                {(selectedLocation as any).accessibility_features.map((feature: string, idx: number) => (
                                                                    <Badge key={idx} variant="outline" className="bg-green-50">
                                                                        ♿ {feature}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {(selectedLocation as LocationWithRelations).amenities && (selectedLocation as LocationWithRelations).amenities!.length > 0 && (
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500 block mb-2">Amenities</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {(selectedLocation as LocationWithRelations).amenities!.map((amenity: string, idx: number) => (
                                                            <Badge key={idx} variant="outline">
                                                                {amenity}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Lot-specific info with enhanced display */}
                                            {(selectedLocation as LocationWithRelations).type === 'lot' && (
                                                <>
                                                    {(selectedLocation as LocationWithRelations).lot?.lot_number && (
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-500">Lot Number</span>
                                                            <p className="text-gray-900">{(selectedLocation as LocationWithRelations).lot!.lot_number}</p>
                                                        </div>
                                                    )}

                                                    {/* Residents with Avatars */}
                                                    {(selectedLocation as LocationWithRelations).residents && (selectedLocation as LocationWithRelations).residents!.length > 0 && (
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-500 block mb-2">
                                                                Residents ({(selectedLocation as LocationWithRelations).residents!.length})
                                                            </span>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(selectedLocation as LocationWithRelations).residents!.slice(0, 6).map((resident: any) => (
                                                                    <button
                                                                        key={resident.id}
                                                                        onClick={() => window.location.href = `/t/${tenantSlug}/dashboard/neighbours/${resident.id}`}
                                                                        className="flex items-center gap-2 bg-gray-50 rounded-full pr-3 py-1 hover:bg-gray-100 transition-colors cursor-pointer"
                                                                    >
                                                                        <img
                                                                            src={resident.profile_picture_url || '/default-avatar.png'}
                                                                            alt={resident.first_name}
                                                                            className="h-8 w-8 rounded-full object-cover border border-gray-200"
                                                                        />
                                                                        <span className="text-sm text-gray-700">
                                                                            {resident.first_name} {resident.last_name?.[0]}.
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                                {(selectedLocation as LocationWithRelations).residents!.length > 6 && (
                                                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                                                                        +{(selectedLocation as LocationWithRelations).residents!.length - 6}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* View Details Button - Now outside the lot block so it shows for facilities too */}
                                            <div className="mt-6">
                                                <Button
                                                    className="w-full"
                                                    onClick={() => {
                                                        const loc = selectedLocation as LocationWithRelations;
                                                        // Use locations path for both lots and facilities to ensure correct routing
                                                        const detailPath = `/t/${tenantSlug}/dashboard/locations/${loc.id}`;
                                                        window.location.href = detailPath;
                                                    }}
                                                >
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* List View - When a category is highlighted but no specific location selected */}
                        {!selectedLocation && highlightedCategories.size > 0 && (
                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {highlightedCategories.size === 1
                                            ? `${categoryButtons.find(c => c.type === Array.from(highlightedCategories)[0])?.label} (${categoryButtons.find(c => c.type === Array.from(highlightedCategories)[0])?.count})`
                                            : 'Selected Categories'}
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

                                <div className="space-y-2">
                                    {/* Check-ins List */}
                                    {highlightedCategories.has('checkin') && (
                                        <div className="space-y-2">
                                            {distributedCheckIns.length > 0 ? (
                                                distributedCheckIns.map((checkIn) => {
                                                    // Calculate time remaining for list item
                                                    const startTime = new Date(checkIn.start_time!).getTime();
                                                    const durationMs = checkIn.duration_minutes! * 60 * 1000;
                                                    const endTime = startTime + durationMs;
                                                    const now = Date.now();
                                                    const timeRemaining = Math.max(0, endTime - now);
                                                    const minutes = Math.floor(timeRemaining / 60000);

                                                    return (
                                                        <button
                                                            key={checkIn.id}
                                                            onClick={() => {
                                                                setSelectedLocation(checkIn);
                                                                focusOnLocation(checkIn);
                                                            }}
                                                            className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-gray-50 transition-all text-left group"
                                                        >
                                                            <div className="relative">
                                                                <img
                                                                    src={checkIn.creator?.profile_picture_url || '/default-avatar.png'}
                                                                    alt={checkIn.creator?.first_name}
                                                                    className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                                                />
                                                                <div className="absolute -bottom-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white"></div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-medium text-gray-900 truncate">
                                                                        {checkIn.creator?.first_name} {checkIn.creator?.last_name?.[0]}.
                                                                    </span>
                                                                    {/* Small RSVP Buttons */}
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                const currentStatus = (checkIn as any).user_rsvp_status;
                                                                                const newStatus = currentStatus === 'yes' ? null : 'yes';
                                                                                const apiStatus = newStatus === null ? 'no' : 'yes';

                                                                                // Optimistic update (would need state management for list items)
                                                                                try {
                                                                                    await rsvpToCheckIn(checkIn.id, tenantId, tenantSlug, apiStatus);
                                                                                } catch (error) {
                                                                                    console.error('Failed to RSVP:', error);
                                                                                }
                                                                            }}
                                                                            className={`h-5 w-5 rounded-full flex items-center justify-center border transition-colors ${(checkIn as any).user_rsvp_status === 'yes' ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200' : 'bg-gray-50 border-gray-200 text-gray-300 hover:bg-gray-100'}`}
                                                                            title="Going"
                                                                        >
                                                                            <Check className="h-3 w-3" />
                                                                        </button>
                                                                        <button
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                const currentStatus = (checkIn as any).user_rsvp_status;
                                                                                const newStatus = currentStatus === 'maybe' ? null : 'maybe';
                                                                                const apiStatus = newStatus === null ? 'no' : 'maybe';

                                                                                try {
                                                                                    await rsvpToCheckIn(checkIn.id, tenantId, tenantSlug, apiStatus);
                                                                                } catch (error) {
                                                                                    console.error('Failed to RSVP:', error);
                                                                                }
                                                                            }}
                                                                            className={`h-5 w-5 rounded-full flex items-center justify-center border transition-colors ${(checkIn as any).user_rsvp_status === 'maybe' ? 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200' : 'bg-gray-50 border-gray-200 text-gray-300 hover:bg-gray-100'}`}
                                                                            title="Maybe"
                                                                        >
                                                                            <span className="text-[10px] font-bold">?</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-gray-600 truncate mt-0.5">
                                                                    at {checkIn.custom_location_name || checkIn.location?.name || 'Unknown Location'}
                                                                </p>
                                                                <div className="flex items-center justify-between mt-1">
                                                                    {checkIn.title && (
                                                                        <p className="text-xs text-gray-500 truncate italic max-w-[120px]">
                                                                            "{checkIn.title}"
                                                                        </p>
                                                                    )}
                                                                    {/* Timer Badge */}
                                                                    <Badge variant={timeRemaining > 300000 ? "outline" : "destructive"} className="text-[10px] h-5 px-1.5 font-mono">
                                                                        {minutes}m left
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )
                                                })
                                            ) : (
                                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                                    <p>No active check-ins found</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Other Categories List */}
                                    {Array.from(highlightedCategories).filter(c => c !== 'checkin').map(categoryType => {
                                        const categoryLocations = locations.filter(loc => loc.type === categoryType);
                                        if (categoryLocations.length === 0) return null;

                                        return (
                                            <div key={categoryType} className="space-y-2">
                                                {highlightedCategories.size > 1 && (
                                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-4 mb-2">
                                                        {categoryButtons.find(c => c.type === categoryType)?.label}
                                                    </h3>
                                                )}
                                                {categoryLocations.map(location => (
                                                    <button
                                                        key={location.id}
                                                        onClick={() => {
                                                            setSelectedLocation(location);
                                                            focusOnLocation(location);
                                                        }}
                                                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-gray-50 transition-all text-left"
                                                    >
                                                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                                                            {categoryButtons.find(c => c.type === location.type)?.icon}
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
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <EditLocationDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                mode={dialogMode}
                locationType={dialogLocationType}
                locationId={selectedLocation?.id}
                geometry={null} // Pass actual geometry if needed for creation, for now simplified
                initialData={selectedLocation}
                lots={locations.filter(l => l.type === 'lot')}
                onSave={handleSaveLocation}
                onCancel={() => setIsDialogOpen(false)}
                onDelete={handleDeleteLocation}
            />
        </div >
    );
}
