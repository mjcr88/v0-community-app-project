import { createServerClient } from "@/lib/supabase/server"
import { cache } from 'react'

export interface CheckIn {
    id: string
    created_by: string
    tenant_id: string
    title: string
    activity_type: string
    description: string | null
    location_type: "community_location" | "custom_temporary"
    location_id: string | null
    custom_location_name: string | null
    custom_location_coordinates: { lat: number; lng: number } | null
    custom_location_type: "marker" | "polygon" | "polyline" | null
    start_time: string
    duration_minutes: number
    status: "active" | "ended"
    visibility_scope: "community" | "neighborhood" | "private"
    created_at: string
    updated_at: string
    ended_at: string | null
}

export interface CheckInWithRelations extends CheckIn {
    creator?: {
        id: string
        first_name: string
        last_name: string
        profile_picture_url: string | null
    } | null
    location?: {
        id: string
        name: string
        type?: string
        coordinates?: any
        boundary_coordinates?: any
        path_coordinates?: any
    } | null
    user_rsvp_status?: "yes" | "maybe" | "no" | null
    attending_count?: number
    invites?: {
        invitee_id: string | null
        family_unit_id: string | null
    }[]
}

export interface GetCheckInsOptions {
    // Filter options
    creatorId?: string
    locationId?: string
    status?: "active" | "ended"
    activeOnly?: boolean // Helper for status=active + time check
    visibilityScopes?: ("community" | "neighborhood" | "private")[]

    // Enrichment options
    enrichWithCreator?: boolean
    enrichWithLocation?: boolean
    enrichWithRsvp?: boolean // Requires current user context if we want user_rsvp_status
    enrichWithInvites?: boolean
}

export const getCheckIns = cache(async (
    tenantId: string,
    options: GetCheckInsOptions = {},
): Promise<CheckInWithRelations[]> => {
    const {
        creatorId,
        locationId,
        status,
        activeOnly = false,
        visibilityScopes,
        enrichWithCreator = false,
        enrichWithLocation = false,
        enrichWithRsvp = false,
        enrichWithInvites = false,
    } = options

    const supabase = await createServerClient()

    let selectQuery = `
    id,
    created_by,
    tenant_id,
    title,
    activity_type,
    description,
    location_type,
    location_id,
    custom_location_name,
    custom_location_coordinates,
    custom_location_type,
    start_time,
    duration_minutes,
    status,
    visibility_scope,
    created_at,
    updated_at,
    ended_at
  `

    if (enrichWithCreator) {
        selectQuery += `,
      creator:users!created_by(id, first_name, last_name, profile_picture_url)
    `
    }

    if (enrichWithLocation) {
        selectQuery += `,
      location:locations!location_id(id, name, coordinates, boundary_coordinates, path_coordinates, photos)
    `
    }

    if (enrichWithInvites) {
        selectQuery += `,
      invites:check_in_invites(invitee_id, family_unit_id)
    `
    }

    let query = supabase.from("check_ins").select(selectQuery).eq("tenant_id", tenantId)

    if (creatorId) {
        query = query.eq("created_by", creatorId)
    }

    if (locationId) {
        query = query.eq("location_id", locationId)
    }

    if (status) {
        query = query.eq("status", status)
    }

    if (activeOnly) {
        query = query.eq("status", "active")
        // Filter out expired check-ins: start_time > (now - 8 hours)
        // We use 8 hours as a safe upper bound for max duration
        const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
        query = query.gte("start_time", eightHoursAgo)
    }

    if (visibilityScopes && visibilityScopes.length > 0) {
        query = query.in("visibility_scope", visibilityScopes)
    }

    const { data: checkIns, error } = await query.order("start_time", { ascending: false })

    if (error) {
        console.error("[get-check-ins] Error fetching check-ins:", error)
        return []
    }

    if (!checkIns || checkIns.length === 0) {
        return []
    }

    // Post-processing for activeOnly to be precise
    let processedCheckIns = checkIns
    if (activeOnly) {
        const now = new Date()
        processedCheckIns = (checkIns as any[]).filter((checkIn) => {
            const expiresAt = new Date(checkIn.start_time)
            expiresAt.setMinutes(expiresAt.getMinutes() + checkIn.duration_minutes + 5) // 5 min buffer
            return expiresAt > now
        })
    }

    if (processedCheckIns.length === 0) {
        return []
    }

    // Handle RSVP enrichment
    let rsvpMap = new Map<string, string>()
    let attendingCountMap = new Map<string, number>()

    if (enrichWithRsvp) {
        const checkInIds = (processedCheckIns as any[]).map((c) => c.id)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const [{ data: userRsvps }, { data: allRsvps }] = await Promise.all([
                supabase.from("check_in_rsvps").select("check_in_id, rsvp_status").eq("user_id", user.id).in("check_in_id", checkInIds),
                supabase.from("check_in_rsvps").select("check_in_id, rsvp_status, attending_count").in("check_in_id", checkInIds),
            ])

            rsvpMap = new Map(userRsvps?.map((r) => [r.check_in_id, r.rsvp_status]) || [])

            allRsvps?.forEach((rsvp) => {
                if (rsvp.rsvp_status === "yes") {
                    const current = attendingCountMap.get(rsvp.check_in_id) || 0
                    attendingCountMap.set(rsvp.check_in_id, current + (rsvp.attending_count || 1))
                }
            })
        }
    }

    return processedCheckIns.map((checkIn: any) => {
        const base: CheckInWithRelations = {
            id: checkIn.id,
            created_by: checkIn.created_by,
            tenant_id: checkIn.tenant_id,
            title: checkIn.title,
            activity_type: checkIn.activity_type,
            description: checkIn.description,
            location_type: checkIn.location_type,
            location_id: checkIn.location_id,
            custom_location_name: checkIn.custom_location_name,
            custom_location_coordinates: checkIn.custom_location_coordinates,
            custom_location_type: checkIn.custom_location_type,
            start_time: checkIn.start_time,
            duration_minutes: checkIn.duration_minutes,
            status: checkIn.status,
            visibility_scope: checkIn.visibility_scope,
            created_at: checkIn.created_at,
            updated_at: checkIn.updated_at,
            ended_at: checkIn.ended_at,
        }

        if (enrichWithCreator && checkIn.creator) {
            base.creator = checkIn.creator
        }

        if (enrichWithLocation && checkIn.location) {
            base.location = checkIn.location
        }

        if (enrichWithInvites && checkIn.invites) {
            base.invites = checkIn.invites
        }

        if (enrichWithRsvp) {
            base.user_rsvp_status = (rsvpMap.get(checkIn.id) as "yes" | "maybe" | "no" | null) || null
            base.attending_count = attendingCountMap.get(checkIn.id) || 0
        }

        return base
    })
})

export async function getCheckInById(
    checkInId: string,
    options: GetCheckInsOptions = {},
): Promise<CheckInWithRelations | null> {
    const supabase = await createServerClient()

    const { data: checkIn } = await supabase.from("check_ins").select("tenant_id").eq("id", checkInId).single()

    if (!checkIn) {
        return null
    }

    const checkIns = await getCheckIns(checkIn.tenant_id, {
        ...options,
        activeOnly: false, // Always find by ID
        status: undefined, // Ignore status filter
    })

    return checkIns.find((c) => c.id === checkInId) || null
}
