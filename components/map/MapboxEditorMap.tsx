'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import Map, { Source, Layer, Marker, NavigationControl, GeolocateControl, MapRef } from 'react-map-gl';
import * as turf from '@turf/turf';
import { MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

import { LocationWithRelations } from '@/lib/data/locations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MapboxEditorMapProps {
    locations: LocationWithRelations[];
    mapCenter?: { lat: number; lng: number } | null;
    mapZoom?: number;
    className?: string;
    onLocationClick?: (locationId: string, location: LocationWithRelations) => void;
    customMarker?: { lat: number; lng: number; label?: string } | null;
    onMapClick?: (coords: { lat: number; lng: number }) => void;
    onPoiClick?: (poi: { name: string; address?: string; lat: number; lng: number }) => void;
    onMapMove?: (center: { lat: number; lng: number; zoom: number }) => void;
    drawingPreview?: {
        type: 'Point' | 'LineString' | 'Polygon';
        coordinates: any;
    } | null;
}

export function MapboxEditorMap({
    locations,
    mapCenter,
    mapZoom = 14,
    className,
    onLocationClick,
    customMarker,
    onMapClick,
    onPoiClick,
    onMapMove,
    drawingPreview,
}: MapboxEditorMapProps) {
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
    const [selectedLocation, setSelectedLocation] = useState<LocationWithRelations | null>(null);
    const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-streets-v12');
    const [currentZoom, setCurrentZoom] = useState(viewState.zoom);
    const mapRef = useRef<MapRef>(null);

    // Auto-focus map on location selection
    const focusOnLocation = useCallback((location: LocationWithRelations) => {
        if (!mapRef.current) return;

        let coords: { lat: number; lng: number } | null = null;

        // Get coordinates based on location type
        if (location.coordinates) {
            coords = location.coordinates;
        } else if (location.boundary_coordinates && location.boundary_coordinates.length > 0) {
            // For boundaries/polygons, use center
            const lats = location.boundary_coordinates.map(([lat]) => lat);
            const lngs = location.boundary_coordinates.map(([, lng]) => lng);
            coords = {
                lat: (Math.min(...lats) + Math.max(...lats)) / 2,
                lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
            };
        } else if (location.path_coordinates && location.path_coordinates.length > 0) {
            // For lots/facilities with path_coordinates but no explicit coordinates
            const lats = location.path_coordinates.map(([lat]) => lat);
            const lngs = location.path_coordinates.map(([, lng]) => lng);
            coords = {
                lat: (Math.min(...lats) + Math.max(...lats)) / 2,
                lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
            };
        }

        if (coords) {
            mapRef.current.flyTo({
                center: [coords.lng, coords.lat],
                zoom: Math.max(currentZoom, 16), // Zoom in closer
                duration: 500, // Reduced from 1000ms for faster animation
            });
        }
    }, [currentZoom]);

    // Collapsible panel state
    const [showLayersPanel, setShowLayersPanel] = useState(false);
    const [showBaseMapPanel, setShowBaseMapPanel] = useState(false);

    // Layer visibility toggles
    const [showBoundary, setShowBoundary] = useState(true);
    const [showLots, setShowLots] = useState(true);
    const [showFacilities, setShowFacilities] = useState(true);
    const [showStreets, setShowStreets] = useState(true);
    const [showPaths, setShowPaths] = useState(true);

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
        <div className={`relative h-full w-full overflow-hidden ${className || ''}`}>
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
                interactiveLayerIds={['lots-fill', 'facilities-fill', 'paths', 'streets', 'poi-label']}
                terrain={
                    mapStyle === "mapbox://styles/mapbox/satellite-streets-v12" && viewState.pitch > 0
                        ? { source: "mapbox-dem", exaggeration: 1.5 }
                        : undefined
                }
                maxPitch={85}
                dragRotate={true}
                touchZoomRotate={true}
                onClick={(e: any) => {
                    if (e.features && e.features.length > 0) {
                        const feature = e.features[0];

                        // Handle Community Location Click
                        if (feature.layer.id === 'lots-fill' || feature.layer.id === 'facilities-fill' || feature.layer.id === 'paths' || feature.layer.id === 'streets') {
                            const locationId = feature.properties.id;
                            const location = locations.find(loc => loc.id === locationId);
                            if (location) {
                                if (onLocationClick) {
                                    onLocationClick(locationId, location);
                                }
                                setSelectedLocation(location);
                            }
                        }
                        // Handle POI Click
                        else if (feature.layer.id === 'poi-label' && onPoiClick) {
                            const name = feature.properties.name || 'Unknown Location';
                            const address = feature.properties.address;

                            onPoiClick({
                                name,
                                address,
                                lat: e.lngLat.lat,
                                lng: e.lngLat.lng
                            });
                        }
                    } else {
                        setSelectedLocation(null);
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
                                    ['==', ['get', 'id'], (selectedLocation?.id || '')],
                                    '#F97316', // Orange when ID matches
                                    '#2D5016', // Default border
                                ],
                                'line-width': [
                                    'case',
                                    ['==', ['get', 'id'], (selectedLocation?.id || '')],
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
                                    ['==', ['get', 'id'], (selectedLocation?.id || '')],
                                    '#F97316', // Orange when ID matches
                                    '#1E40AF', // Default border
                                ],
                                'line-width': [
                                    'case',
                                    ['==', ['get', 'id'], (selectedLocation?.id || '')],
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

                {/* Custom Marker */}
                {customMarker && (
                    <Marker
                        latitude={customMarker.lat}
                        longitude={customMarker.lng}
                        anchor="bottom"
                    >
                        <div className="flex flex-col items-center">
                            <div className="bg-white px-2 py-1 rounded shadow text-xs font-medium mb-1 whitespace-nowrap">
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
                                'line-color': '#8C8C8C',
                                'line-width': 3,
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
                                'line-color': '#6B9B47',
                                'line-width': 2,
                                'line-dasharray': [3, 3],
                            }}
                        />
                    </Source>
                )}

                {/* Facility Markers (Points) */}
                {showFacilities && locations.map(location => {
                    // Only show markers for Point facilities (no path_coordinates)
                    if (location.type !== 'facility' || !location.coordinates || (location.path_coordinates && location.path_coordinates.length > 0)) return null;

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
                            <div className={`cursor-pointer transform transition-transform hover:scale-110`}>
                                <div className={`bg-white p-1.5 rounded-full shadow-md border ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-gray-200'} text-xl flex items-center justify-center w-10 h-10`}>
                                    {location.icon || '🏛️'}
                                </div>
                            </div>
                        </Marker>
                    );
                })}

                {/* Map Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <NavigationControl showCompass={true} showZoom={true} />
                    <GeolocateControl />
                    {/* Reset Camera Button */}
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-[29px] w-[29px] rounded-md bg-white shadow-md hover:bg-gray-100"
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
                    <div className="mt-2 rounded-lg border bg-white p-4 shadow-lg w-56">
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
                    <div className="mt-2 rounded-lg border bg-white p-4 shadow-lg w-64">
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
    );
}
