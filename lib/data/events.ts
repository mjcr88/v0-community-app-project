import { createServerClient } from "@/lib/supabase/server"
import { cache } from 'react'

export interface Event {
    id: string
    title: string
    description: string | null
    start_date: string
    start_time: string | null
    end_date: string | null
    end_time: string | null
    location_id: string | null
    category_id: string | null
    created_by: string
    tenant_id: string
    created_at: string
    updated_at: string
    is_all_day: boolean

    event_type: "official" | "community"
    status: "draft" | "published" | "cancelled"
    visibility_scope: "community" | "neighborhood" | "private"
    requires_rsvp: boolean
    rsvp_deadline: string | null
    max_attendees: number | null
    location_type: "community_location" | "custom_temporary" | null
    custom_location_name: string | null
    custom_location_coordinates: { lat: number; lng: number } | null
    custom_location_type: "marker" | "polygon" | "polyline" | null
    cancelled_by: string | null
    cancelled_at: string | null
    cancellation_reason: string | null
}

export interface EventWithRelations extends Event {
    location?: {
        id: string
        name: string
        coordinates: { lat: number; lng: number } | null
    } | null
    category?: {
        id: string
        name: string
        icon: string
    } | null
    creator?: {
        id: string
        first_name: string
        last_name: string
        profile_picture_url: string | null
    } | null
    user_rsvp_status?: string | null
    is_saved?: boolean
    _count?: {
        rsvps: number
        flags?: number
    }
}

export interface GetEventsOptions {
    // Filter options
    ids?: string[]
    startDate?: string
    endDate?: string
    categoryId?: string
    locationId?: string
    creatorId?: string
    search?: string
    requestingUserId?: string
    status?: string[]

    // Enrichment options
    enrichWithLocation?: boolean
    enrichWithCategory?: boolean
    enrichWithCreator?: boolean
    enrichWithRsvpCount?: boolean
    enrichWithUserRsvp?: boolean
    enrichWithSavedStatus?: boolean
    enrichWithFlagCount?: boolean
}

export const getEvents = cache(async (
    tenantId: string,
    options: GetEventsOptions = {},
): Promise<EventWithRelations[]> => {
    const {
        ids,
        startDate,
        endDate,
        categoryId,
        locationId,
        creatorId,
        search,
        requestingUserId,
        status,
        enrichWithLocation = false,
        enrichWithCategory = false,
        enrichWithCreator = false,
        enrichWithRsvpCount = false,
        enrichWithUserRsvp = false,
        enrichWithSavedStatus = false,
        enrichWithFlagCount = false,
    } = options

    const supabase = await createServerClient()

    let selectQuery = `
    id,
    title,
    description,
    start_date,
    start_time,
    end_date,
    end_time,
    location_id,
    category_id,
    created_by,
    tenant_id,
    created_at,
    updated_at,
    is_all_day,
    event_type,
    status,
    visibility_scope,
    requires_rsvp,
    rsvp_deadline,
    max_attendees,
    location_type,
    custom_location_name,
    custom_location_coordinates,
    custom_location_type,
    cancelled_by,
    cancelled_at,
    cancellation_reason
  `

    if (enrichWithLocation) {
        selectQuery += `,
      locations:location_id(id, name, coordinates, photos)
    `
    }

    if (enrichWithCategory) {
        selectQuery += `,
      event_categories:category_id(id, name, icon)
    `
    }

    if (enrichWithCreator) {
        selectQuery += `,
      creator:created_by(id, first_name, last_name, profile_picture_url)
    `
    }

    if (enrichWithRsvpCount) {
        selectQuery += `,
      rsvps:event_rsvps(count)
    `
    }

    let query = supabase.from("events").select(selectQuery).eq("tenant_id", tenantId)

    if (ids && ids.length > 0) {
        query = query.in("id", ids)
    }

    if (startDate) {
        // Filter for events that end on or after this date (upcoming/ongoing events)
        query = query.gte("start_date", startDate)
    }

    if (endDate) {
        // Filter for events that start on or before this date
        query = query.lte("start_date", endDate)
    }

    if (categoryId) {
        query = query.eq("category_id", categoryId)
    }

    if (locationId) {
        query = query.eq("location_id", locationId)
    }

    if (creatorId) {
        query = query.eq("created_by", creatorId)
    }

    if (search) {
        query = query.ilike("title", `%${search}%`)
    }

    if (status && status.length > 0) {
        query = query.in("status", status)
    }

    const { data: events, error } = await query
        .order("start_date", { ascending: true })
        .order("start_time", { ascending: true, nullsFirst: false })

    if (error) {
        console.error("[get-events] Error fetching events:", error)
        return []
    }

    if (!events || events.length === 0) {
        return []
    }

    // Fetch additional data if needed
    const eventIds = events.map((e: any) => e.id)
    let userRsvpMap = new Map<string, string>()
    let savedSet = new Set<string>()
    let flagCountMap = new Map<string, number>()

    if (requestingUserId && enrichWithUserRsvp) {
        const { data: rsvps } = await supabase
            .from("event_rsvps")
            .select("event_id, rsvp_status")
            .eq("user_id", requestingUserId)
            .in("event_id", eventIds)

        if (rsvps) {
            rsvps.forEach((r) => userRsvpMap.set(r.event_id, r.rsvp_status))
        }
    }

    if (requestingUserId && enrichWithSavedStatus) {
        const { data: saved } = await supabase
            .from("saved_events")
            .select("event_id")
            .eq("user_id", requestingUserId)
            .in("event_id", eventIds)

        if (saved) {
            saved.forEach((s) => savedSet.add(s.event_id))
        }
    }

    if (enrichWithFlagCount) {
        const flagCounts = await Promise.all(
            eventIds.map(async (eventId: string) => {
                const { data: count } = await supabase.rpc("get_event_flag_count", {
                    p_event_id: eventId,
                    p_tenant_id: tenantId,
                })
                return { eventId, count: count ?? 0 }
            })
        )
        flagCounts.forEach((f) => flagCountMap.set(f.eventId, f.count))
    }

    return events.map((event: any) => {
        const base: EventWithRelations = {
            id: event.id,
            title: event.title,
            description: event.description,
            start_date: event.start_date,
            start_time: event.start_time,
            end_date: event.end_date,
            end_time: event.end_time,
            location_id: event.location_id,
            category_id: event.category_id,
            created_by: event.created_by,
            tenant_id: event.tenant_id,
            created_at: event.created_at,
            updated_at: event.updated_at,
            is_all_day: event.is_all_day,

            event_type: event.event_type,
            status: event.status,
            visibility_scope: event.visibility_scope,
            requires_rsvp: event.requires_rsvp,
            rsvp_deadline: event.rsvp_deadline,
            max_attendees: event.max_attendees,
            location_type: event.location_type,
            custom_location_name: event.custom_location_name,
            custom_location_coordinates: event.custom_location_coordinates,
            custom_location_type: event.custom_location_type,
            cancelled_by: event.cancelled_by,
            cancelled_at: event.cancelled_at,
            cancellation_reason: event.cancellation_reason,
        }

        if (enrichWithLocation && event.locations) {
            base.location = event.locations
        }

        if (enrichWithCategory && event.event_categories) {
            base.category = event.event_categories
        }

        if (enrichWithCreator && event.creator) {
            base.creator = event.creator
        }

        if (enrichWithRsvpCount && event.rsvps) {
            base._count = {
                ...base._count,
                rsvps: event.rsvps[0]?.count || 0
            }
        }

        if (enrichWithFlagCount) {
            base._count = {
                ...base._count,
                flags: flagCountMap.get(event.id) || 0,
                rsvps: base._count?.rsvps || 0 // Ensure rsvps is preserved if it exists
            }
        }

        if (enrichWithUserRsvp) {
            base.user_rsvp_status = userRsvpMap.get(event.id) || null
        }

        if (enrichWithSavedStatus) {
            base.is_saved = savedSet.has(event.id)
        }

        return base
    })
})

export async function getEventById(
    eventId: string,
    options: GetEventsOptions = {},
): Promise<EventWithRelations | null> {
    const supabase = await createServerClient()

    const { data: event } = await supabase.from("events").select("tenant_id").eq("id", eventId).single()

    if (!event) {
        return null
    }

    const events = await getEvents(event.tenant_id, {
        ...options,
        startDate: undefined, // Clear date filters to find specific event
        endDate: undefined
    })

    return events.find((e) => e.id === eventId) || null
}
