'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Map, { Source, Layer, Marker, NavigationControl, GeolocateControl, MapRef } from 'react-map-gl';
import * as turf from '@turf/turf';
import { MapPin, Search, Layers, Filter, X } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

import { LocationWithRelations } from '@/lib/data/locations';
import { Card } from '@/components/ui/card';
import { LocationInfoCard } from './location-info-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ResidentMapClientProps {
    locations: LocationWithRelations[];
    tenantId: string;
    tenantSlug: string;
    mapCenter?: { lat: number; lng: number } | null;
    mapZoom?: number;
}

export function ResidentMapClient({
    locations,
    tenantId,
    tenantSlug,
    mapCenter,
    mapZoom = 14,
}: ResidentMapClientProps) {
    const [viewState, setViewState] = useState({
        longitude: mapCenter?.lng || -84.5333,
        latitude: mapCenter?.lat || 9.9567,
        zoom: mapZoom,
        pitch: 0,
        bearing: 0,
    });

    // Map state
    const [hoveredLot, setHoveredLot] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<LocationWithRelations | null>(null);
    const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-streets-v12');
    const [searchQuery, setSearchQuery] = useState('');

    // Filters
    const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>({
        lot: true,
        facility: true,
        walking_path: true,
        public_street: true,
        boundary: true,
        green_area: true,
        playground: true,
        protection_zone: true,
        easement: true,
        recreational_zone: true,
    });

    const mapRef = useRef<MapRef>(null);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // Filter locations based on visibility and search
    const filteredLocations = useMemo(() => {
        return locations.filter(loc => {
            // Type filter
            if (!visibleTypes[loc.type]) return false;

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    loc.name.toLowerCase().includes(query) ||
                    loc.type.toLowerCase().includes(query) ||
                    (loc.lot?.lot_number && loc.lot.lot_number.toLowerCase().includes(query))
                );
            }

            return true;
        });
    }, [locations, visibleTypes, searchQuery]);

    // GeoJSON Data Generation
    const geojsonData = useMemo(() => {
        const points: any[] = [];
        const polygons: any[] = [];
        const lines: any[] = [];

        filteredLocations.forEach(loc => {
            const properties = {
                id: loc.id,
                name: loc.name,
                type: loc.type,
                description: loc.description,
                status: loc.status,
            };

            // Determine if it's a polygon or line based on type
            const isPolygonType = loc.type === 'facility' || loc.type === 'lot' || loc.type === 'boundary' || loc.type === 'protection_zone' || loc.type === 'green_area' || loc.type === 'recreational_zone';
            const isLineType = loc.type === 'walking_path' || loc.type === 'public_street';

            // Handle boundaries/polygons (from boundary_coordinates)
            if (loc.boundary_coordinates && loc.boundary_coordinates.length > 0) {
                const coords = [...loc.boundary_coordinates];
                if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
                    coords.push(coords[0]);
                }
                const polygonCoords = coords.map(c => [c[1], c[0]]);
                polygons.push(turf.polygon([polygonCoords], properties));
            }

            // Handle polygons (from path_coordinates - e.g. facilities, lots)
            if (isPolygonType && loc.path_coordinates && loc.path_coordinates.length > 0) {
                const coords = [...loc.path_coordinates];
                // Ensure closed polygon
                if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
                    coords.push(coords[0]);
                }
                const polygonCoords = coords.map(c => [c[1], c[0]]);
                polygons.push(turf.polygon([polygonCoords], properties));
            }

            // Handle lines (from path_coordinates)
            if (isLineType && loc.path_coordinates && loc.path_coordinates.length > 0) {
                const lineCoords = loc.path_coordinates.map(c => [c[1], c[0]]);
                lines.push(turf.lineString(lineCoords, properties));
            }

            // Handle points
            // Only add point if it has coordinates AND it's NOT being rendered as a polygon/line
            // (i.e. if it has path/boundary coordinates, we assume the shape is enough)
            const hasShape = (loc.boundary_coordinates && loc.boundary_coordinates.length > 0) ||
                (loc.path_coordinates && loc.path_coordinates.length > 0);

            if (loc.coordinates && !hasShape) {
                points.push(turf.point([loc.coordinates.lng, loc.coordinates.lat], properties));
            }
        });

        return {
            points: turf.featureCollection(points),
            polygons: turf.featureCollection(polygons),
            lines: turf.featureCollection(lines),
        };
    }, [filteredLocations]);

    const handleLocationClick = useCallback((event: any) => {
        const feature = event.features?.[0];
        if (feature) {
            const locationId = feature.properties.id;
            const location = locations.find(l => l.id === locationId);
            if (location) {
                setSelectedLocation(location);

                // Fly to location
                if (location.coordinates) {
                    mapRef.current?.flyTo({
                        center: [location.coordinates.lng, location.coordinates.lat],
                        zoom: 18,
                        duration: 1000
                    });
                } else if (location.boundary_coordinates && location.boundary_coordinates.length > 0) {
                    // Calculate center of polygon
                    const lats = location.boundary_coordinates.map(c => c[0]);
                    const lngs = location.boundary_coordinates.map(c => c[1]);
                    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
                    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

                    mapRef.current?.flyTo({
                        center: [centerLng, centerLat],
                        zoom: 17,
                        duration: 1000
                    });
                }
            }
        }
    }, [locations]);

    // Layer Styles
    const layers = {
        polygons: {
            id: 'polygons-fill',
            type: 'fill',
            paint: {
                'fill-color': [
                    'match',
                    ['get', 'type'],
                    'lot', '#4ade80', // green-400
                    'boundary', 'transparent',
                    'protection_zone', '#f87171', // red-400
                    'green_area', '#22c55e', // green-500
                    'recreational_zone', '#06b6d4', // cyan-500
                    '#cccccc'
                ],
                'fill-opacity': [
                    'match',
                    ['get', 'type'],
                    'lot', 0.1,
                    'boundary', 0,
                    0.2
                ]
            }
        },
        lines: {
            id: 'lines-stroke',
            type: 'line',
            paint: {
                'line-color': [
                    'match',
                    ['get', 'type'],
                    'lot', '#ffffff',
                    'boundary', '#3b82f6', // blue-500
                    'walking_path', '#84cc16', // lime-500
                    'public_street', '#eab308', // yellow-500
                    'easement', '#9ca3af', // gray-400
                    '#ffffff'
                ],
                'line-width': [
                    'match',
                    ['get', 'type'],
                    'boundary', 3,
                    'public_street', 4,
                    'walking_path', 2,
                    1
                ],
                'line-opacity': 0.8
            }
        },
        points: {
            id: 'points-circle',
            type: 'circle',
            paint: {
                'circle-radius': 6,
                'circle-color': [
                    'match',
                    ['get', 'type'],
                    'facility', '#f97316', // orange-500
                    'playground', '#ec4899', // pink-500
                    '#3b82f6'
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        }
    };

    return (
        <div className="relative w-full h-[calc(100vh-120px)] rounded-xl overflow-hidden border shadow-sm flex">
            {/* Map Container - Responsive width based on selection */}
            <div className={`relative h-full transition-all duration-300 ease-in-out ${selectedLocation ? 'w-2/3' : 'w-full'}`}>
                {/* Top Bar Controls */}
                <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row gap-2 justify-between pointer-events-none">
                    {/* Search */}
                    <div className="pointer-events-auto relative w-full sm:w-72">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search locations..."
                                className="pl-9 bg-white/90 backdrop-blur-sm shadow-sm border-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="pointer-events-auto flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm shadow-sm h-10">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filters
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Location Types</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.keys(visibleTypes).map((type) => (
                                    <DropdownMenuCheckboxItem
                                        key={type}
                                        checked={visibleTypes[type]}
                                        onCheckedChange={(checked) =>
                                            setVisibleTypes(prev => ({ ...prev, [type]: checked }))
                                        }
                                        className="capitalize"
                                    >
                                        {type.replace('_', ' ')}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm shadow-sm h-10">
                                    <Layers className="h-4 w-4 mr-2" />
                                    Style
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuCheckboxItem
                                    checked={mapStyle.includes('satellite')}
                                    onCheckedChange={() => setMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
                                >
                                    Satellite
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={mapStyle.includes('streets') && !mapStyle.includes('satellite')}
                                    onCheckedChange={() => setMapStyle('mapbox://styles/mapbox/streets-v12')}
                                >
                                    Streets
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={mapStyle.includes('outdoors')}
                                    onCheckedChange={() => setMapStyle('mapbox://styles/mapbox/outdoors-v12')}
                                >
                                    Outdoors
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Map
                    ref={mapRef}
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle={mapStyle}
                    mapboxAccessToken={mapboxToken}
                    interactiveLayerIds={['polygons-fill', 'points-circle']}
                    onClick={handleLocationClick}
                    onMouseMove={(e) => {
                        const feature = e.features?.[0];
                        if (feature) {
                            mapRef.current?.getCanvas().style.setProperty('cursor', 'pointer');
                            setHoveredLot(feature.properties?.name);
                        } else {
                            mapRef.current?.getCanvas().style.setProperty('cursor', '');
                            setHoveredLot(null);
                        }
                    }}
                >
                    <NavigationControl position="bottom-right" />
                    <GeolocateControl position="bottom-right" />

                    {/* Polygons Layer */}
                    <Source id="polygons" type="geojson" data={geojsonData.polygons}>
                        <Layer {...layers.polygons as any} />
                    </Source>

                    {/* Lines Layer */}
                    <Source id="lines" type="geojson" data={geojsonData.lines}>
                        <Layer {...layers.lines as any} />
                    </Source>

                    {/* Points Layer */}
                    <Source id="points" type="geojson" data={geojsonData.points}>
                        <Layer {...layers.points as any} />
                    </Source>
                </Map>
            </div>

            {/* Sidebar - Shows single selection */}
            <div
                className={`relative h-full bg-white border-l border-gray-200 transition-all duration-300 ease-in-out overflow-y-auto ${selectedLocation ? 'w-1/3' : 'w-0'}`}
            >
                {selectedLocation && (
                    <div className="h-full">
                        <LocationInfoCard
                            location={selectedLocation}
                            onClose={() => setSelectedLocation(null)}
                            tenantSlug={tenantSlug}
                            className="h-full"
                            variant="embedded"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
