'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Marker, Source, Layer } from 'react-map-gl';
import { MapboxFullViewer } from '@/components/map/MapboxViewer';

import { DrawingToolbar } from './DrawingToolbar';
import { EditSidebar } from './EditSidebar';
import { LocationWithRelations } from '@/lib/data/locations';
import { useToast } from '@/hooks/use-toast';
import { createLocation, updateLocation, deleteLocation } from '@/app/actions/locations';

type DrawMode = 'point' | 'line' | 'polygon' | null;
type LocationType = 'facility' | 'lot' | 'walking_path';

interface MapboxEditorClientProps {
    locations: LocationWithRelations[];
    lots: Array<{ id: string; lot_number: string; address: string | null; neighborhoods: { name: string } | null }>;
    tenantId: string;
    tenantSlug: string;
    mapCenter: { lat: number; lng: number } | null;
    mapZoom: number;
}

interface EditSidebarState {
    mode: 'create' | 'edit';
    locationType: LocationType | null;
    locationId?: string;
    geometry: {
        type: 'Point' | 'LineString' | 'Polygon';
        coordinates: any;
    } | null;
}

export function MapboxEditorClient({
    locations,
    lots,
    tenantId,
    tenantSlug,
    mapCenter,
    mapZoom,
}: MapboxEditorClientProps) {
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const [drawMode, setDrawMode] = useState<DrawMode>(null);
    const [drawingPoints, setDrawingPoints] = useState<Array<{ lat: number; lng: number }>>([]);
    const [editSidebar, setEditSidebar] = useState<EditSidebarState | null>(null);

    // Drawing handlers
    const handleDrawPoint = useCallback(() => {
        if (drawMode === 'point') {
            setDrawMode(null);
            setDrawingPoints([]);
        } else {
            setDrawMode('point');
            setDrawingPoints([]);
            toast({
                description: 'Click on the map to drop a pin',
            });
        }
    }, [drawMode, toast]);

    const handleDrawLine = useCallback(() => {
        if (drawMode === 'line') {
            setDrawMode(null);
            setDrawingPoints([]);
        } else {
            setDrawMode('line');
            setDrawingPoints([]);
            toast({
                description: 'Click on the map to draw a line (need at least 2 points)',
            });
        }
    }, [drawMode, toast]);

    const handleDrawPolygon = useCallback(() => {
        if (drawMode === 'polygon') {
            setDrawMode(null);
            setDrawingPoints([]);
        } else {
            setDrawMode('polygon');
            setDrawingPoints([]);
            toast({
                description: 'Click on the map to draw a polygon (need at least 3 points)',
            });
        }
    }, [drawMode, toast]);

    const handleMapClick = useCallback(
        (coords: { lat: number; lng: number }) => {
            // Don't handle map clicks if sidebar is open (prevent accidental resets)
            if (editSidebar) return;

            if (!drawMode) return;

            if (drawMode === 'point') {
                // Point complete immediately
                setEditSidebar({
                    mode: 'create',
                    locationType: null,
                    geometry: {
                        type: 'Point',
                        coordinates: [coords.lng, coords.lat],
                    },
                });
                setDrawMode(null);
                setDrawingPoints([]);
            } else {
                // Add point to line/polygon
                setDrawingPoints((prev) => [...prev, coords]);
            }
        },
        [drawMode]
    );

    const handleUndo = useCallback(() => {
        if (drawingPoints.length > 0) {
            setDrawingPoints((prev) => prev.slice(0, -1));
        }
    }, [drawingPoints]);

    const handleFinish = useCallback(() => {
        if (drawMode === 'line' && drawingPoints.length >= 2) {
            setEditSidebar({
                mode: 'create',
                locationType: null,
                geometry: {
                    type: 'LineString',
                    coordinates: drawingPoints.map((p) => [p.lng, p.lat]),
                },
            });
            setDrawMode(null);
            setDrawingPoints([]);
        } else if (drawMode === 'polygon' && drawingPoints.length >= 3) {
            // Close the polygon by adding first point at the end
            const closedPoints = [...drawingPoints, drawingPoints[0]];
            setEditSidebar({
                mode: 'create',
                locationType: null,
                geometry: {
                    type: 'Polygon',
                    coordinates: [closedPoints.map((p) => [p.lng, p.lat])],
                },
            });
            setDrawMode(null);
            setDrawingPoints([]);
        } else {
            toast({
                title: 'Cannot finish drawing',
                description:
                    drawMode === 'line'
                        ? 'Need at least 2 points for a line'
                        : 'Need at least 3 points for a polygon',
                variant: 'destructive',
            });
        }
    }, [drawMode, drawingPoints, toast]);

    const handleClear = useCallback(() => {
        setDrawMode(null);
        setDrawingPoints([]);
        toast({
            description: 'Drawing cleared',
        });
    }, [toast]);

    const handleLocationClick = useCallback((locationId: string, location: LocationWithRelations) => {
        // Extract geometry from location
        let geometry: { type: 'Point' | 'LineString' | 'Polygon'; coordinates: any } | null = null;

        if (location.coordinates) {
            // Point geometry
            geometry = {
                type: 'Point',
                coordinates: [location.coordinates.lng, location.coordinates.lat],
            };
        } else if (location.boundary_coordinates && location.boundary_coordinates.length > 0) {
            // Polygon geometry
            geometry = {
                type: 'Polygon',
                coordinates: [location.boundary_coordinates.map(coord => [coord[1], coord[0]])], // Convert [lat, lng] to [lng, lat]
            };
        } else if (location.path_coordinates && location.path_coordinates.length > 0) {
            // LineString geometry  
            geometry = {
                type: 'LineString',
                coordinates: location.path_coordinates.map(coord => [coord[1], coord[0]]), // Convert [lat, lng] to [lng, lat]
            };
        }

        setEditSidebar({
            mode: 'edit',
            locationType: location.type as LocationType,
            locationId: location.id,
            geometry: geometry,
        });
    }, []);

    const canUndo = drawingPoints.length > 0;
    const canFinish =
        (drawMode === 'line' && drawingPoints.length >= 2) ||
        (drawMode === 'polygon' && drawingPoints.length >= 3);

    // Create drawing preview GeoJSON for visualization
    let drawingPreview: { type: 'Point' | 'LineString' | 'Polygon'; coordinates: any } | null = null;

    // Priority 1: Active drawing
    if (drawMode && drawingPoints.length > 0) {
        if (drawMode === 'point') {
            // Single point
            drawingPreview = {
                type: 'Point',
                coordinates: [drawingPoints[0].lng, drawingPoints[0].lat],
            };
        } else if (drawMode === 'line') {
            // Line - show from first point onwards
            if (drawingPoints.length === 1) {
                // Just one point - show as a point
                drawingPreview = {
                    type: 'Point',
                    coordinates: [drawingPoints[0].lng, drawingPoints[0].lat],
                };
            } else {
                // Multiple points - show as line
                drawingPreview = {
                    type: 'LineString',
                    coordinates: drawingPoints.map(p => [p.lng, p.lat]),
                };
            }
        } else if (drawMode === 'polygon') {
            // Polygon - show from first point onwards
            if (drawingPoints.length === 1) {
                // Just one point
                drawingPreview = {
                    type: 'Point',
                    coordinates: [drawingPoints[0].lng, drawingPoints[0].lat],
                };
            } else if (drawingPoints.length === 2) {
                // Two points - show as line
                drawingPreview = {
                    type: 'LineString',
                    coordinates: drawingPoints.map(p => [p.lng, p.lat]),
                };
            } else {
                // Three or more points - show as polygon
                const coords = drawingPoints.map(p => [p.lng, p.lat]);
                // Add first point at end to close the polygon for visualization
                coords.push(coords[0]);
                drawingPreview = {
                    type: 'Polygon',
                    coordinates: [coords],
                };
            }
        }
    }
    // Priority 2: Pending geometry from sidebar (create mode)
    else if (editSidebar?.mode === 'create' && editSidebar.geometry) {
        drawingPreview = editSidebar.geometry;
    }

    return (
        <div className="relative h-screen w-full">
            {/* Map */}
            {/* Map */}
            <MapboxFullViewer
                locations={locations}
                checkIns={[]}
                tenantId={tenantId}
                tenantSlug={tenantSlug}
                mapCenter={mapCenter}
                mapZoom={mapZoom}
                onLocationClick={handleLocationClick}
                onMapClick={handleMapClick}
                enableSelection={false}
            >
                {drawingPreview && (
                    <Source
                        id="drawing-source"
                        type="geojson"
                        data={{
                            type: "Feature",
                            geometry: drawingPreview,
                            properties: {},
                        }}
                    >
                        <Layer
                            id="drawing-point"
                            type="circle"
                            filter={["==", "$type", "Point"]}
                            paint={{
                                "circle-radius": 6,
                                "circle-color": editSidebar?.locationType === 'facility' ? '#3B82F6' : '#f97316',
                                "circle-stroke-width": 2,
                                "circle-stroke-color": "#ffffff",
                            }}
                        />
                        <Layer
                            id="drawing-line"
                            type="line"
                            filter={["==", "$type", "LineString"]}
                            paint={{
                                "line-color": editSidebar?.locationType === 'walking_path' ? '#f97316' : '#f97316',
                                "line-width": 3,
                            }}
                        />
                        <Layer
                            id="drawing-polygon-fill"
                            type="fill"
                            filter={["==", "$type", "Polygon"]}
                            paint={{
                                "fill-color": editSidebar?.locationType === 'lot' ? '#86B25C' :
                                    editSidebar?.locationType === 'facility' ? '#3B82F6' : '#f97316',
                                "fill-opacity": 0.2,
                            }}
                        />
                        <Layer
                            id="drawing-polygon-outline"
                            type="line"
                            filter={["==", "$type", "Polygon"]}
                            paint={{
                                "line-color": editSidebar?.locationType === 'lot' ? '#86B25C' :
                                    editSidebar?.locationType === 'facility' ? '#3B82F6' : '#f97316',
                                "line-width": 2,
                            }}
                        />
                    </Source>
                )}
            </MapboxFullViewer>

            {/* Drawing Toolbar */}
            <DrawingToolbar
                onDrawPoint={handleDrawPoint}
                onDrawLine={handleDrawLine}
                onDrawPolygon={handleDrawPolygon}
                onUndo={handleUndo}
                onFinish={handleFinish}
                onClear={handleClear}
                activeMode={drawMode}
                canUndo={canUndo}
                canFinish={canFinish}
                sidebarOpen={editSidebar !== null}
            />

            {/* Drawing Progress Indicator - Moved to bottom to avoid overlap */}
            {drawMode && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border z-[1001]">
                    <p className="text-sm font-medium">
                        {drawMode === 'point' && 'Click on the map to drop a pin'}
                        {drawMode === 'line' &&
                            (drawingPoints.length === 0
                                ? 'Click on the map to start drawing'
                                : drawingPoints.length < 2
                                    ? `${drawingPoints.length} point placed (need ${2 - drawingPoints.length} more)`
                                    : `${drawingPoints.length} points placed - Ready to finish!`)}
                        {drawMode === 'polygon' &&
                            (drawingPoints.length === 0
                                ? 'Click on the map to start drawing'
                                : drawingPoints.length < 3
                                    ? `${drawingPoints.length} point(s) placed (need ${3 - drawingPoints.length} more)`
                                    : `${drawingPoints.length} points placed - Ready to finish!`)}
                    </p>
                </div>
            )}

            {/* Temporary drawing visualization */}
            {/* TODO: Render drawingPoints on the map as a preview */}

            {/* Edit Sidebar */}
            {editSidebar && (
                <EditSidebar
                    mode={editSidebar.mode}
                    locationType={editSidebar.locationType}
                    locationId={editSidebar.locationId}
                    geometry={editSidebar.geometry}
                    initialData={
                        editSidebar.mode === 'edit' && editSidebar.locationId
                            ? (() => {
                                const loc = locations.find(l => l.id === editSidebar.locationId);
                                if (!loc) return {};
                                // Transform snake_case DB fields to camelCase for form
                                // Convert array to object for checkbox state
                                const amenitiesObj = loc.amenities
                                    ? (loc.amenities as string[]).reduce((acc, key) => ({ ...acc, [key]: true }), {})
                                    : undefined;
                                const accessibilityObj = loc.accessibility_features
                                    ? (loc.accessibility_features as string[]).reduce((acc, key) => ({ ...acc, [key]: true }), {})
                                    : undefined;
                                return {
                                    ...loc,
                                    facilityType: loc.facility_type,
                                    heroPhoto: loc.hero_photo,
                                    parkingSpaces: loc.parking_spaces,
                                    maxOccupancy: loc.max_occupancy,
                                    amenities: amenitiesObj,
                                    accessibilityFeatures: accessibilityObj,
                                };
                            })()
                            : {}
                    } // Pass existing location data in edit mode
                    lots={lots}
                    onTypeSelect={(type) => {
                        setEditSidebar(prev => prev ? { ...prev, locationType: type } : null);
                    }}
                    onSave={async (data) => {
                        try {
                            // Calculate centroid ONLY for point-based markers
                            // For polygons and lines, coordinates should be null to preserve their rendering type
                            let coordinates = null;
                            if (editSidebar.geometry?.type === 'Point') {
                                coordinates = { lat: editSidebar.geometry.coordinates[1], lng: editSidebar.geometry.coordinates[0] };
                            }

                            const locationData = {
                                tenant_id: tenantId,
                                name: data.name,
                                type: data.type,
                                description: data.description,
                                coordinates: coordinates, // Only set for Point geometry
                                boundary_coordinates: (editSidebar.geometry?.type === 'Polygon' && data.type === 'boundary')
                                    ? editSidebar.geometry.coordinates[0].map((c: any) => [c[1], c[0]]) // [lng, lat] -> [lat, lng]
                                    : null,
                                path_coordinates: (editSidebar.geometry?.type === 'LineString' || (editSidebar.geometry?.type === 'Polygon' && data.type !== 'boundary'))
                                    ? (editSidebar.geometry.type === 'Polygon'
                                        ? editSidebar.geometry.coordinates[0].map((c: any) => [c[1], c[0]])
                                        : editSidebar.geometry.coordinates.map((c: any) => [c[1], c[0]]))
                                    : null,
                                facility_type: data.facilityType,
                                icon: data.icon,
                                lot_id: data.lot_id,
                                photos: data.photos,
                                hero_photo: data.heroPhoto,
                                capacity: data.capacity ? parseInt(data.capacity) : null,
                                max_occupancy: data.maxOccupancy ? parseInt(data.maxOccupancy) : null,
                                // Convert amenities object {wifi: true, parking: false} to array ['wifi']
                                amenities: data.amenities
                                    ? Object.entries(data.amenities)
                                        .filter(([_, enabled]) => enabled)
                                        .map(([key]) => key)
                                    : null,
                                hours: data.hours || null,
                                status: data.status || null,
                                parking_spaces: data.parkingSpaces ? parseInt(data.parkingSpaces) : null,
                                // Convert accessibility object to array
                                accessibility_features: data.accessibilityFeatures
                                    ? Object.entries(data.accessibilityFeatures)
                                        .filter(([_, enabled]) => enabled)
                                        .map(([key]) => key)
                                    : null,
                                opening_hours: data.opening_hours,
                                contact_phone: data.contact_phone,
                                contact_email: data.contact_email,
                                website: data.website,
                                rules: data.rules,
                                color: data.color,
                                // Path specific fields
                                path_difficulty: data.path_difficulty,
                                path_surface: data.path_surface,
                                path_length: (data.path_length !== null && data.path_length !== undefined) ? String(data.path_length) : null,
                                elevation_gain: (data.elevation_gain !== null && data.elevation_gain !== undefined) ? String(data.elevation_gain) : null,
                            };

                            if (editSidebar.mode === 'create') {
                                await createLocation(locationData, pathname);
                                toast({
                                    title: 'Location Created',
                                    description: 'The location has been successfully created.',
                                });
                            } else if (editSidebar.mode === 'edit' && editSidebar.locationId) {
                                await updateLocation(editSidebar.locationId, locationData, pathname);
                                toast({
                                    title: 'Location Updated',
                                    description: 'The location has been successfully updated.',
                                });
                            }

                            setEditSidebar(null);
                            router.refresh();
                        } catch (error) {
                            console.error('Error saving location:', error);
                            toast({
                                title: 'Error',
                                description: 'Failed to save location. Please try again.',
                                variant: 'destructive',
                            });
                        }
                    }}
                    onCancel={() => setEditSidebar(null)}
                    onDelete={async (id) => {
                        try {
                            await deleteLocation(id, tenantId, pathname);
                            toast({
                                title: 'Location Deleted',
                                description: 'The location has been successfully deleted.',
                            });
                            setEditSidebar(null);
                            router.refresh();
                        } catch (error) {
                            console.error('Error deleting location:', error);
                            toast({
                                title: 'Error',
                                description: 'Failed to delete location. Please try again.',
                                variant: 'destructive',
                            });
                        }
                    }}
                />
            )}
        </div>
    );
}
