import { createServerClient } from "@/lib/supabase/server"
import { cache } from "react"

export interface ResidentRequest {
    id: string
    tenant_id: string
    created_by: string | null
    original_submitter_id: string
    title: string
    request_type: string
    description: string | null
    priority: string
    status: string
    location_type: string | null
    location_id: string | null
    custom_location_name: string | null
    custom_location_lat: number | null
    custom_location_lng: number | null
    is_anonymous: boolean
    images: string[]
    tagged_resident_ids: string[]
    tagged_pet_ids: string[]
    admin_reply: string | null
    admin_internal_notes: string | null
    rejection_reason: string | null
    resolved_at: string | null
    resolved_by: string | null
    first_reply_at: string | null
    created_at: string
    updated_at: string
}

export interface ResidentRequestWithRelations extends ResidentRequest {
    creator?: {
        id: string
        first_name: string
        last_name: string
        profile_picture_url: string | null
    } | null
    original_submitter?: {
        id: string
        first_name: string
        last_name: string
        profile_picture_url: string | null
    } | null
    location?: {
        id: string
        name: string
        type: string
    } | null
    resolved_by_user?: {
        id: string
        first_name: string
        last_name: string
    } | null
    tagged_residents?: {
        id: string
        first_name: string
        last_name: string
        profile_picture_url: string | null
    }[]
    tagged_pets?: {
        id: string
        name: string
        species: string
        breed: string
        profile_picture_url: string | null
        family_unit?: {
            id: string
            name: string
            primary_contact?: {
                id: string
                first_name: string
                last_name: string
                profile_picture_url: string | null
            } | null
        } | null
    }[]
}

export interface GetResidentRequestsOptions {
    // Filter options
    creatorId?: string
    originalSubmitterId?: string
    status?: string
    excludeStatus?: string
    types?: string[]

    // Enrichment options
    enrichWithCreator?: boolean
    enrichWithOriginalSubmitter?: boolean
    enrichWithLocation?: boolean
    enrichWithResolvedBy?: boolean
    enrichWithTaggedEntities?: boolean
}

export const getResidentRequests = cache(async (
    tenantId: string,
    options: GetResidentRequestsOptions = {}
): Promise<ResidentRequestWithRelations[]> => {
    const {
        creatorId,
        originalSubmitterId,
        status,
        excludeStatus,
        types,
        enrichWithCreator = false,
        enrichWithOriginalSubmitter = false,
        enrichWithLocation = false,
        enrichWithResolvedBy = false,
        enrichWithTaggedEntities = false,
    } = options

    const supabase = await createServerClient()

    let selectQuery = `
    id,
    tenant_id,
    created_by,
    original_submitter_id,
    title,
    request_type,
    description,
    priority,
    status,
    location_type,
    location_id,
    custom_location_name,
    custom_location_lat,
    custom_location_lng,
    is_anonymous,
    images,
    tagged_resident_ids,
    tagged_pet_ids,
    admin_reply,
    admin_internal_notes,
    rejection_reason,
    resolved_at,
    resolved_by,
    first_reply_at,
    created_at,
    updated_at
  `

    if (enrichWithCreator) {
        selectQuery += `,
      creator:users!created_by(id, first_name, last_name, profile_picture_url)
    `
    }

    if (enrichWithOriginalSubmitter) {
        selectQuery += `,
      original_submitter:users!original_submitter_id(id, first_name, last_name, profile_picture_url)
    `
    }

    if (enrichWithLocation) {
        selectQuery += `,
      location:locations!location_id(id, name, type)
    `
    }

    if (enrichWithResolvedBy) {
        selectQuery += `,
      resolved_by_user:users!resolved_by(id, first_name, last_name)
    `
    }

    let query = supabase
        .from("resident_requests")
        .select(selectQuery)
        .eq("tenant_id", tenantId)

    if (creatorId) {
        query = query.eq("created_by", creatorId)
    }

    if (originalSubmitterId) {
        query = query.eq("original_submitter_id", originalSubmitterId)
    }

    if (status) {
        query = query.eq("status", status)
    }

    if (excludeStatus) {
        query = query.neq("status", excludeStatus)
    }

    if (types && types.length > 0) {
        query = query.in("request_type", types)
    }

    const { data: requests, error } = await query.order("created_at", { ascending: false })

    if (error) {
        console.error("[get-resident-requests] Error fetching requests:", error)
        return []
    }

    if (!requests || requests.length === 0) {
        return []
    }

    // Handle tagged entities enrichment if requested
    let taggedResidentsMap = new Map<string, any[]>()
    let taggedPetsMap = new Map<string, any[]>()

    if (enrichWithTaggedEntities) {
        const allTaggedResidentIds = [...new Set(requests.flatMap((r: any) => r.tagged_resident_ids || []))]
        const allTaggedPetIds = [...new Set(requests.flatMap((r: any) => r.tagged_pet_ids || []))]

        if (allTaggedResidentIds.length > 0) {
            const { data: residents } = await supabase
                .from("users")
                .select("id, first_name, last_name, profile_picture_url")
                .in("id", allTaggedResidentIds)
                .eq("tenant_id", tenantId)

            if (residents) {
                const residentMap = new Map(residents.map(r => [r.id, r]))
                requests.forEach((r: any) => {
                    if (r.tagged_resident_ids && r.tagged_resident_ids.length > 0) {
                        const tagged = r.tagged_resident_ids.map((id: string) => residentMap.get(id)).filter(Boolean)
                        taggedResidentsMap.set(r.id, tagged)
                    }
                })
            }
        }

        if (allTaggedPetIds.length > 0) {
            const { data: pets } = await supabase
                .from("pets")
                .select(`
          id,
          name,
          species,
          breed,
          profile_picture_url,
          family_unit:family_unit_id(id, name, primary_contact:primary_contact_id(id, first_name, last_name, profile_picture_url))
        `)
                .in("id", allTaggedPetIds)

            if (pets) {
                const petMap = new Map(pets.map(p => [p.id, p]))
                requests.forEach((r: any) => {
                    if (r.tagged_pet_ids && r.tagged_pet_ids.length > 0) {
                        const tagged = r.tagged_pet_ids.map((id: string) => petMap.get(id)).filter(Boolean)
                        taggedPetsMap.set(r.id, tagged)
                    }
                })
            }
        }
    }

    return requests.map((request: any) => {
        const base: ResidentRequestWithRelations = {
            ...request,
            tagged_residents: taggedResidentsMap.get(request.id) || [],
            tagged_pets: taggedPetsMap.get(request.id) || [],
        }
        return base
    })
})

export async function getResidentRequestById(
    requestId: string,
    options: GetResidentRequestsOptions = {}
): Promise<ResidentRequestWithRelations | null> {
    const supabase = await createServerClient()

    const { data: request } = await supabase
        .from("resident_requests")
        .select("tenant_id")
        .eq("id", requestId)
        .single()

    if (!request) {
        return null
    }

    const requests = await getResidentRequests(request.tenant_id, {
        ...options,
        // Ensure we find the specific request regardless of other filters
        status: undefined,
        excludeStatus: undefined,
        types: undefined,
    })

    return requests.find(r => r.id === requestId) || null
}
