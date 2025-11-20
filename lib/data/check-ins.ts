import { createServerClient } from "@/lib/supabase/server"
import { cache } from 'react'

export interface CheckIn {
    id: string
    user_id: string
    location_id: string | null
    tenant_id: string
    message: string | null
    created_at: string
    expires_at: string | null
}

export interface CheckInWithRelations extends CheckIn {
    user?: {
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
}

export interface GetCheckInsOptions {
    // Filter options
    userId?: string
    locationId?: string
    activeOnly?: boolean

    // Enrichment options
    enrichWithUser?: boolean
    enrichWithLocation?: boolean
}

export const getCheckIns = cache(async (
    tenantId: string,
    options: GetCheckInsOptions = {},
): Promise<CheckInWithRelations[]> => {
    const {
        userId,
        locationId,
        activeOnly = true,
        enrichWithUser = false,
        enrichWithLocation = false,
    } = options

    const supabase = await createServerClient()

    let selectQuery = `
    id,
    user_id,
    location_id,
    tenant_id,
    message,
    created_at,
    expires_at
  `

    if (enrichWithUser) {
        selectQuery += `,
      user:user_id(id, first_name, last_name, profile_picture_url)
    `
    }

    if (enrichWithLocation) {
        selectQuery += `,
      location:location_id(id, name, type)
    `
    }

    let query = supabase.from("check_ins").select(selectQuery).eq("tenant_id", tenantId)

    if (userId) {
        query = query.eq("user_id", userId)
    }

    if (locationId) {
        query = query.eq("location_id", locationId)
    }

    if (activeOnly) {
        // Only show check-ins created in the last 24 hours or explicitly not expired
        // Note: This logic might need adjustment based on specific business rules
        // For now, we'll assume check-ins are valid for 24 hours if no expiry is set
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        query = query.gte("created_at", twentyFourHoursAgo)
    }

    const { data: checkIns, error } = await query.order("created_at", { ascending: false })

    if (error) {
        console.error("[get-check-ins] Error fetching check-ins:", error)
        return []
    }

    if (!checkIns || checkIns.length === 0) {
        return []
    }

    return checkIns.map((checkIn: any) => {
        const base: CheckInWithRelations = {
            id: checkIn.id,
            user_id: checkIn.user_id,
            location_id: checkIn.location_id,
            tenant_id: checkIn.tenant_id,
            message: checkIn.message,
            created_at: checkIn.created_at,
            expires_at: checkIn.expires_at,
        }

        if (enrichWithUser && checkIn.user) {
            base.user = checkIn.user
        }

        if (enrichWithLocation && checkIn.location) {
            base.location = checkIn.location
        }

        return base
    })
})
