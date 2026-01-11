export interface Location {
    id: string
    name: string
    type: "facility" | "lot" | "walking_path" | "neighborhood" | "boundary" | "public_street" | "protection_zone" | "easement"
    coordinates?: { lat: number; lng: number } | null
    boundary_coordinates?: Array<[number, number]>
    path_coordinates?: Array<[number, number]>
    description?: string | null
    capacity?: number | null
    max_occupancy?: number | null
    amenities?: string[] | null
    hours?: string | null
    parking_spaces?: number | null
    accessibility_features?: string | null
    rules?: string | null
    path_difficulty?: string | null
    path_surface?: string | null
    path_length?: string | null
    elevation_gain?: string | null
    is_reservable?: boolean
}
