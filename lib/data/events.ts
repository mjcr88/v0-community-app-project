import { createServerClient } from "@/lib/supabase/server"
import { cache } from 'react'

export interface Event {
    id: string
    title: string
    description: string | null
    start_time: string
    end_time: string
    location_id: string | null
    category_id: string | null
    created_by: string
    tenant_id: string
    created_at: string
    updated_at: string
    is_all_day: boolean
    recurrence_rule: string | null
}

export interface EventWithRelations extends Event {
    location?: {
        id: string
        name: string
    } | null
    category?: {
        id: string
        name: string
        color: string
    } | null
    creator?: {
        id: string
        first_name: string
        last_name: string
        profile_picture_url: string | null
    } | null
    _count?: {
        rsvps: number
    }
}

export interface GetEventsOptions {
    // Filter options
    startDate?: string
    endDate?: string
    categoryId?: string
    locationId?: string
    creatorId?: string
    search?: string

    // Enrichment options
    enrichWithLocation?: boolean
    enrichWithCategory?: boolean
    enrichWithCreator?: boolean
    enrichWithRsvpCount?: boolean
}

export const getEvents = cache(async (
    tenantId: string,
    options: GetEventsOptions = {},
): Promise<EventWithRelations[]> => {
    const {
        startDate,
        endDate,
        categoryId,
        locationId,
        creatorId,
        search,
        enrichWithLocation = false,
        enrichWithCategory = false,
        enrichWithCreator = false,
        enrichWithRsvpCount = false,
    } = options

    const supabase = await createServerClient()

    let selectQuery = `
    id,
    title,
    description,
    start_time,
    end_time,
    location_id,
    category_id,
    created_by,
    tenant_id,
    created_at,
    updated_at,
    is_all_day,
    recurrence_rule
  `

    if (enrichWithLocation) {
        selectQuery += `,
      locations:location_id(id, name)
    `
    }

    if (enrichWithCategory) {
        selectQuery += `,
      event_categories:category_id(id, name, color)
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

    if (startDate) {
        query = query.gte("end_time", startDate)
    }

    if (endDate) {
        query = query.lte("start_time", endDate)
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

    const { data: events, error } = await query.order("start_time", { ascending: true })

    if (error) {
        console.error("[get-events] Error fetching events:", error)
        return []
    }

    if (!events || events.length === 0) {
        return []
    }

    return events.map((event: any) => {
        const base: EventWithRelations = {
            id: event.id,
            title: event.title,
            description: event.description,
            start_time: event.start_time,
            end_time: event.end_time,
            location_id: event.location_id,
            category_id: event.category_id,
            created_by: event.created_by,
            tenant_id: event.tenant_id,
            created_at: event.created_at,
            updated_at: event.updated_at,
            is_all_day: event.is_all_day,
            recurrence_rule: event.recurrence_rule,
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
                rsvps: event.rsvps[0]?.count || 0
            }
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
