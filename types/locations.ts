export interface Location {
    id: string
    name: string
    type: "facility" | "lot" | "walking_path" | "neighborhood" | "boundary" | "public_street" | "protection_zone" | "easement"
    coordinates?: { lat: number; lng: number } | null
    boundary_coordinates?: Array<[number, number]>
    path_coordinates?: Array<[number, number]>
    description?: string | null
    icon?: string | null
    facility_type?: string | null

    // Feature properties
    amenities?: string[] | null
    parking_spaces?: number | null
    accessibility_features?: string | null
    rules?: string | null

    // Walking path properties
    path_difficulty?: string | null
    path_surface?: string | null
    path_length?: number | null
    elevation_gain?: number | null

    // Media properties
    hero_photo?: string | null
    photos?: string[] | null
    status?: string | null

    // Foreign keys
    lot_id?: string | null
    neighborhood_id?: string
    tenant_id?: string
}
