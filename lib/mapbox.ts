// Mapbox configuration and utilities

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

export const MAPBOX_STYLES = {
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  streets: "mapbox://styles/mapbox/streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
} as const

export const DEFAULT_MAP_CONFIG = {
  center: [-84.0, 10.0] as [number, number], // Costa Rica default
  zoom: 15,
  minZoom: 10,
  maxZoom: 20,
} as const

// Location type colors
export const LOCATION_COLORS = {
  facility: "#3b82f6", // blue
  lot: "#10b981", // green
  walking_path: "#f59e0b", // amber
} as const

// Path surface colors
export const PATH_SURFACE_COLORS = {
  paved: "#6b7280", // gray
  gravel: "#92400e", // brown
  dirt: "#78350f", // dark brown
  natural: "#15803d", // dark green
} as const

export interface Coordinates {
  lat: number
  lng: number
}

export interface CoordinatesWithAccuracy extends Coordinates {
  accuracy?: number
}

export interface Location {
  id: string
  tenant_id: string
  name: string
  type: "facility" | "lot" | "walking_path"
  description?: string
  coordinates?: Coordinates
  boundary_coordinates?: Coordinates[]
  path_coordinates?: Coordinates[]
  facility_type?: string
  hours?: string
  icon?: string
  path_surface?: "paved" | "gravel" | "dirt" | "natural"
  path_difficulty?: "easy" | "moderate" | "difficult"
  photos?: string[]
  lot_id?: string
  neighborhood_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CheckIn {
  id: string
  user_id: string
  tenant_id: string
  location_id?: string
  coordinates: CoordinatesWithAccuracy
  message?: string
  activity_type?: string
  photo_url?: string
  duration_minutes: number
  expires_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Convert database coordinates to Mapbox format [lng, lat]
export function toMapboxCoordinates(coords: Coordinates): [number, number] {
  return [coords.lng, coords.lat]
}

// Convert Mapbox coordinates [lng, lat] to database format
export function fromMapboxCoordinates(coords: [number, number]): Coordinates {
  return { lng: coords[0], lat: coords[1] }
}

// Validate coordinates
export function isValidCoordinates(coords: any): coords is Coordinates {
  return (
    coords &&
    typeof coords.lat === "number" &&
    typeof coords.lng === "number" &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180
  )
}

// Calculate distance between two points (Haversine formula)
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180
  const φ2 = (coord2.lat * Math.PI) / 180
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}
