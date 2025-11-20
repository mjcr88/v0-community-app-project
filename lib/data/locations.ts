import { createServerClient } from "@/lib/supabase/server"
import { cache } from 'react'

// Core location types matching database schema
export type LocationType =
  | "facility"
  | "lot"
  | "walking_path"
  | "neighborhood"
  | "boundary"
  | "public_street"
  | "protection_zone"
  | "easement"
  | "playground"
  | "green_area"
  | "recreational_zone"

export interface Coordinates {
  lat: number
  lng: number
}

export interface Resident {
  id: string
  first_name: string
  last_name: string
  profile_picture_url: string | null
  family_unit_id: string | null
  lot_id: string | null
  email: string | null
}

export interface FamilyUnit {
  id: string
  name: string
  profile_picture_url: string | null
  description: string | null
}

export interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  profile_picture_url: string | null
  family_unit_id: string
}

export interface Neighborhood {
  id: string
  name: string
}

export interface Lot {
  id: string
  lot_number: string
  address: string | null
}

// Base location without relations
export interface BaseLocation {
  id: string
  name: string
  type: LocationType
  coordinates: Coordinates | null
  boundary_coordinates: Array<[number, number]> | null
  path_coordinates: Array<[number, number]> | null
  description: string | null
  icon: string | null
  facility_type: string | null
  photos: string[] | null
  lot_id: string | null
  neighborhood_id: string | null
  tenant_id: string
  amenities: string[] | null
  capacity: number | null
  hours: string | null
  path_difficulty: string | null
  path_surface: string | null
  status: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

// Location with optional enriched relations
export interface LocationWithRelations extends BaseLocation {
  neighborhood?: Neighborhood | null
  lot?: Lot | null
  residents?: Resident[]
  family_units?: FamilyUnit[]
  pets?: Pet[]
}

export interface GetLocationsOptions {
  // Filter options
  types?: LocationType[]
  neighborhoodId?: string
  lotId?: string

  // Enrichment options
  enrichWithNeighborhood?: boolean
  enrichWithLot?: boolean
  enrichWithResidents?: boolean
  enrichWithFamilies?: boolean
  enrichWithPets?: boolean

  // User context (for permission-based filtering)
  userRole?: "super_admin" | "tenant_admin" | "resident"
  userId?: string
}

/**
 * Unified query function for fetching locations with optional enrichment
 * Handles null safety, proper serialization, and consistent data structure
 *
 * @param tenantId - The tenant ID to fetch locations for
 * @param options - Optional filters and enrichment flags
 * @returns Array of locations with optional relations
 */
export const getLocations = cache(async (
  tenantId: string,
  options: GetLocationsOptions = {},
): Promise<LocationWithRelations[]> => {
  const {
    types,
    neighborhoodId,
    lotId,
    enrichWithNeighborhood = false,
    enrichWithLot = false,
    enrichWithResidents = false,
    enrichWithFamilies = false,
    enrichWithPets = false,
  } = options

  const supabase = await createServerClient()

  // Build the select query based on enrichment options
  let selectQuery = `
    id,
    name,
    type,
    coordinates,
    boundary_coordinates,
    path_coordinates,
    description,
    icon,
    facility_type,
    photos,
    lot_id,
    neighborhood_id,
    tenant_id,
    amenities,
    capacity,
    hours,
    path_difficulty,
    path_surface,
    status,
    created_at,
    updated_at,
    created_by
  `

  // Add neighborhood if requested
  if (enrichWithNeighborhood) {
    selectQuery += `,
      neighborhoods:neighborhood_id(id, name)
    `
  }

  // Add lot if requested
  if (enrichWithLot) {
    selectQuery += `,
      lots:lot_id(id, lot_number, address)
    `
  }

  // Start building the query
  let query = supabase.from("locations").select(selectQuery).eq("tenant_id", tenantId)

  // Apply filters
  if (types && types.length > 0) {
    query = query.in("type", types)
  }

  if (neighborhoodId) {
    query = query.eq("neighborhood_id", neighborhoodId)
  }

  if (lotId) {
    query = query.eq("lot_id", lotId)
  }

  // Execute query
  const { data: locations, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("[get-locations] Error fetching locations:", error)
    return []
  }

  if (!locations || locations.length === 0) {
    return []
  }

  // Transform the data to our interface, handling null values properly
  const transformedLocations: LocationWithRelations[] = locations.map((loc: any) => {
    const base: LocationWithRelations = {
      id: loc.id,
      name: loc.name,
      type: loc.type as LocationType,
      coordinates: loc.coordinates || null,
      boundary_coordinates: loc.boundary_coordinates || null,
      path_coordinates: loc.path_coordinates || null,
      description: loc.description || null,
      icon: loc.icon || null,
      facility_type: loc.facility_type || null,
      photos: loc.photos || null,
      lot_id: loc.lot_id || null,
      neighborhood_id: loc.neighborhood_id || null,
      tenant_id: loc.tenant_id,
      amenities: loc.amenities || null,
      capacity: loc.capacity || null,
      hours: loc.hours || null,
      path_difficulty: loc.path_difficulty || null,
      path_surface: loc.path_surface || null,
      status: loc.status || null,
      created_at: loc.created_at,
      updated_at: loc.updated_at,
      created_by: loc.created_by || null,
    }

    // Add enriched data if available
    if (enrichWithNeighborhood && loc.neighborhoods) {
      base.neighborhood = loc.neighborhoods
    }

    if (enrichWithLot && loc.lots) {
      base.lot = loc.lots
    }

    return base
  })

  // Enrich with residents, families, and pets if requested
  // This is done in a second pass to avoid complex joins that cause issues
  if ((enrichWithResidents || enrichWithFamilies || enrichWithPets) && transformedLocations.length > 0) {
    // Get all lot IDs from locations
    const lotIds = transformedLocations
      .filter((loc) => loc.lot_id && loc.type === "lot")
      .map((loc) => loc.lot_id!)
      .filter((id, index, self) => self.indexOf(id) === index) // Unique IDs

    if (lotIds.length > 0) {
      // Fetch residents for these lots
      const { data: residents } = await supabase
        .from("users")
        .select("id, first_name, last_name, profile_picture_url, family_unit_id, lot_id, email")
        .in("lot_id", lotIds)
        .eq("role", "resident")

      // Create a map of lot_id to residents
      const residentsByLot: Record<string, Resident[]> = {}
      if (residents) {
        residents.forEach((resident: any) => {
          if (!residentsByLot[resident.lot_id]) {
            residentsByLot[resident.lot_id] = []
          }
          residentsByLot[resident.lot_id].push({
            id: resident.id,
            first_name: resident.first_name,
            last_name: resident.last_name,
            profile_picture_url: resident.profile_picture_url || null,
            family_unit_id: resident.family_unit_id || null,
            lot_id: resident.lot_id || null,
            email: resident.email || null,
          })
        })
      }

      // Fetch family units if requested
      const familiesByLot: Record<string, FamilyUnit[]> = {}
      if (enrichWithFamilies && residents) {
        const familyUnitIds = residents
          .map((r: any) => r.family_unit_id)
          .filter((id: string | null): id is string => id !== null)
          .filter((id, index, self) => self.indexOf(id) === index)

        if (familyUnitIds.length > 0) {
          const { data: families } = await supabase
            .from("family_units")
            .select("id, name, profile_picture_url, description")
            .in("id", familyUnitIds)

          if (families) {
            // Map families back to lots
            residents.forEach((resident: any) => {
              if (resident.family_unit_id && resident.lot_id) {
                const family = families.find((f: any) => f.id === resident.family_unit_id)
                if (family) {
                  if (!familiesByLot[resident.lot_id]) {
                    familiesByLot[resident.lot_id] = []
                  }
                  // Avoid duplicates
                  if (!familiesByLot[resident.lot_id].find((f) => f.id === family.id)) {
                    familiesByLot[resident.lot_id].push({
                      id: family.id,
                      name: family.name,
                      profile_picture_url: family.profile_picture_url || null,
                      description: family.description || null,
                    })
                  }
                }
              }
            })
          }
        }
      }

      // Fetch pets if requested
      const petsByLot: Record<string, Pet[]> = {}
      if (enrichWithPets && residents) {
        const familyUnitIds = residents
          .map((r: any) => r.family_unit_id)
          .filter((id: string | null): id is string => id !== null)
          .filter((id, index, self) => self.indexOf(id) === index)

        if (familyUnitIds.length > 0) {
          const { data: pets } = await supabase
            .from("pets")
            .select("id, name, species, breed, profile_picture_url, family_unit_id")
            .in("family_unit_id", familyUnitIds)

          if (pets) {
            // Map pets back to lots via family units
            residents.forEach((resident: any) => {
              if (resident.family_unit_id && resident.lot_id) {
                const familyPets = pets.filter((p: any) => p.family_unit_id === resident.family_unit_id)
                if (familyPets.length > 0) {
                  if (!petsByLot[resident.lot_id]) {
                    petsByLot[resident.lot_id] = []
                  }
                  familyPets.forEach((pet: any) => {
                    // Avoid duplicates
                    if (!petsByLot[resident.lot_id].find((p) => p.id === pet.id)) {
                      petsByLot[resident.lot_id].push({
                        id: pet.id,
                        name: pet.name,
                        species: pet.species,
                        breed: pet.breed || null,
                        profile_picture_url: pet.profile_picture_url || null,
                        family_unit_id: pet.family_unit_id,
                      })
                    }
                  })
                }
              }
            })
          }
        }
      }

      // Attach enriched data to locations
      transformedLocations.forEach((location) => {
        if (location.lot_id) {
          if (enrichWithResidents && residentsByLot[location.lot_id]) {
            location.residents = residentsByLot[location.lot_id]
          }
          if (enrichWithFamilies && familiesByLot[location.lot_id]) {
            location.family_units = familiesByLot[location.lot_id]
          }
          if (enrichWithPets && petsByLot[location.lot_id]) {
            location.pets = petsByLot[location.lot_id]
          }
        }
      })
    }
  }

  return transformedLocations
})

/**
 * Get location counts by type for a tenant
 * Useful for dashboard statistics
 */
export async function getLocationCounts(tenantId: string): Promise<Record<string, number>> {
  const supabase = await createServerClient()

  const { data, error } = await supabase.from("locations").select("type").eq("tenant_id", tenantId)

  if (error || !data) {
    return {}
  }

  // Count by type
  const counts: Record<string, number> = {}
  data.forEach((location: any) => {
    counts[location.type] = (counts[location.type] || 0) + 1
  })

  return counts
}

/**
 * Get a single location by ID with optional enrichment
 */
export async function getLocationById(
  locationId: string,
  options: GetLocationsOptions = {},
): Promise<LocationWithRelations | null> {
  const supabase = await createServerClient()

  const { data: location } = await supabase.from("locations").select("tenant_id").eq("id", locationId).single()

  if (!location) {
    return null
  }

  const locations = await getLocations(location.tenant_id, {
    ...options,
  })

  return locations.find((loc) => loc.id === locationId) || null
}
