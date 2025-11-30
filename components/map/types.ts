import { LocationWithRelations } from '@/lib/data/locations';

/**
 * Check-in interface for map display
 */
export interface CheckIn {
    id: string;
    resident: {
        id: string;
        first_name: string;
        last_name: string;
        profile_picture_url?: string;
    };
    location: {
        id: string;
        name: string;
        type: string;
        coordinates?: { lat: number; lng: number };
    } | null;
    coordinates?: { lat: number; lng: number };
    displayCoords?: { lat: number; lng: number };
    created_at: string;
    expires_at: string;
    activity_type?: string;
    title?: string;
    custom_location_name?: string;
    start_time?: string;
    duration_minutes?: number;
    description?: string;
    visibility_scope?: string;
    location_type?: string;
    custom_location_coordinates?: { lat: number; lng: number };
    user_rsvp_status?: 'yes' | 'maybe' | 'no' | null;
}

/**
 * Custom styling options for map elements
 */
export interface MapboxViewerStyles {
    lotColor?: string;
    lotBorderColor?: string;
    facilityColor?: string;
    facilityBorderColor?: string;
    selectionColor?: string;
    streetColor?: string;
    pathColor?: string;
    boundaryColor?: string;
}

/**
 * Configuration for layer visibility
 */
export interface LayerVisibility {
    boundary?: boolean;
    lots?: boolean;
    facilities?: boolean;
    streets?: boolean;
    paths?: boolean;
    checkIns?: boolean;
}

/**
 * Map style options
 */
export type MapStyle =
    | 'mapbox://styles/mapbox/satellite-streets-v12'
    | 'mapbox://styles/mapbox/streets-v12'
    | 'mapbox://styles/mapbox/outdoors-v12';

/**
 * Props for MapboxViewer component
 */
export interface MapboxViewerProps {
    /** Array of locations to display on the map */
    locations: LocationWithRelations[];

    /** Array of check-ins to display on the map */
    checkIns?: CheckIn[];

    /** Tenant ID for RSVP actions */
    tenantId: string;

    /** Tenant slug for routing */
    tenantSlug: string;

    /** Initial map center coordinates */
    initialCenter?: { lat: number; lng: number } | null;

    /** Initial zoom level (default: 14) */
    initialZoom?: number;

    /** Callback when a location is clicked */
    onLocationClick?: (location: LocationWithRelations | CheckIn) => void;

    /** Show map controls (navigation, geolocate, reset camera) */
    showControls?: boolean;

    /** Show layer toggle panel */
    showLayerToggles?: boolean;

    /** Show base map style selector */
    showBaseMapSelector?: boolean;

    /** Show search bar */
    showSearch?: boolean;

    /** Show category filter buttons */
    showCategoryFilters?: boolean;

    /** Enable location selection (sidebar) */
    enableSelection?: boolean;

    /** Enable 3D terrain */
    enable3DTerrain?: boolean;

    /** Highlight specific location IDs */
    highlightLocationIds?: string[];

    /** Custom styles for map elements */
    customStyles?: MapboxViewerStyles;

    /** Initial layer visibility settings */
    initialLayerVisibility?: LayerVisibility;

    /** Initial map style */
    initialMapStyle?: MapStyle;

    /** Mapbox access token (optional, defaults to env var) */
    mapboxToken?: string;

    /** Additional CSS classes for container */
    className?: string;

    /** Show loading state */
    isLoading?: boolean;

    /** Error message to display */
    error?: string | null;
}
