import { createServerClient } from "@/lib/supabase/server"
import { cache } from 'react'

export interface ExchangeListing {
    id: string
    title: string
    description: string
    type: 'offer' | 'request'
    category_id: string | null
    created_by: string
    tenant_id: string
    status: 'draft' | 'published' | 'archived' | 'completed'
    pricing_type: 'free' | 'fixed_price' | 'pay_what_you_want'
    price: number | null
    condition: 'new' | 'slightly_used' | 'used' | 'slightly_damaged' | 'maintenance' | null
    available_quantity: number
    images: string[] | null
    hero_photo: string | null
    custom_location_name: string | null
    custom_location_lat: number | null
    custom_location_lng: number | null
    location_id: string | null
    visibility_scope: 'community' | 'neighborhood'
    is_available: boolean
    photos: string[] | null
    created_at: string
    updated_at: string
    published_at: string | null
    archived_at: string | null
}

export interface ExchangeListingWithRelations extends ExchangeListing {
    category?: {
        id: string
        name: string
        description: string | null
    } | null
    creator?: {
        id: string
        first_name: string
        last_name: string
        profile_picture_url: string | null
        email?: string
        phone?: string
    } | null
    location?: {
        id: string
        name: string
        type?: string
        coordinates?: any
        path_coordinates?: any
        boundary_coordinates?: any
    } | null
    neighborhoods?: {
        id: string
        name: string
    }[]
    flag_count?: number
    price_amount?: number | null // Alias for price for compatibility
}

export interface GetExchangeListingsOptions {
    // Filter options
    type?: ('offer' | 'request')[]
    status?: ('draft' | 'published' | 'archived' | 'completed')[]
    categoryId?: string
    creatorId?: string
    search?: string
    includeDraftsByCreator?: string // userId to include drafts for
    excludeArchived?: boolean

    // Enrichment options
    enrichWithCategory?: boolean
    enrichWithCreator?: boolean
    enrichWithLocation?: boolean
    enrichWithNeighborhoods?: boolean
    enrichWithFlagCount?: boolean
}

export const getExchangeListings = cache(async (
    tenantId: string,
    options: GetExchangeListingsOptions = {},
): Promise<ExchangeListingWithRelations[]> => {
    const {
        type,
        status,
        categoryId,
        creatorId,
        search,
        includeDraftsByCreator,
        excludeArchived = true,
        enrichWithCategory = false,
        enrichWithCreator = false,
        enrichWithLocation = false,
        enrichWithNeighborhoods = false,
        enrichWithFlagCount = false,
    } = options

    const supabase = await createServerClient()

    let selectQuery = `
    id,
    title,
    description,
    category_id,
    created_by,
    tenant_id,
    status,
    pricing_type,
    price,
    condition,
    available_quantity,
    photos,
    hero_photo,
    custom_location_name,
    custom_location_lat,
    custom_location_lng,
    location_id,
    visibility_scope,
    is_available,
    created_at,
    updated_at,
    published_at,
    archived_at
  `

    if (enrichWithCategory) {
        selectQuery += `,
      exchange_categories:category_id(id, name, description)
    `
    }

    if (enrichWithCreator) {
        selectQuery += `,
      creator:users!created_by(id, first_name, last_name, profile_picture_url, email, phone)
    `
    }

    if (enrichWithLocation) {
        selectQuery += `,
      locations:location_id(id, name, type, coordinates, path_coordinates, boundary_coordinates)
    `
    }

    if (enrichWithNeighborhoods) {
        selectQuery += `,
      exchange_neighborhoods(neighborhood:neighborhoods(id, name))
    `
    }

    let query = supabase.from("exchange_listings").select(selectQuery).eq("tenant_id", tenantId)

    // Note: 'type' column does not exist in exchange_listings table
    // if (type && type.length > 0) {
    //     query = query.in("type", type)
    // }

    // Status filtering logic
    if (includeDraftsByCreator) {
        // Logic: (status = published) OR (status = draft AND created_by = user)
        // If other status filters are present, we need to combine them.
        // This is complex with Supabase query builder.
        // Simplified approach: Use .or() with the specific logic
        // Note: This overrides the 'status' array filter if present, which might be acceptable or needs combination.
        // If 'status' is provided (e.g. ['completed']), we might want to respect it.
        // But the use case for includeDraftsByCreator is usually the main feed.
        query = query.or(`status.eq.published,and(status.eq.draft,created_by.eq.${includeDraftsByCreator})`)
    } else if (status && status.length > 0) {
        query = query.in("status", status)
    } else {
        // Default behavior if no status filter: show active/published
        // If we are not including drafts, we probably just want published?
        // Or if no status specified, maybe we want all?
        // The original action defaulted to: .or(`status.eq.published,and(status.eq.draft,created_by.eq.${user.id})`)
        // So if includeDraftsByCreator is NOT set, we probably just want published?
        // Let's default to published if nothing else specified.
        if (!creatorId) { // If filtering by creator, we might want all their statuses
            query = query.eq("status", "published")
        }
    }

    if (excludeArchived) {
        query = query.is("archived_at", null)
    }

    if (categoryId) {
        query = query.eq("category_id", categoryId)
    }

    if (creatorId) {
        query = query.eq("created_by", creatorId)
    }

    if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: listings, error } = await query.order("created_at", { ascending: false })

    if (error) {
        console.error("[get-exchange-listings] Error fetching listings:", error)
        return []
    }

    if (!listings || listings.length === 0) {
        return []
    }

    // Handle Flag Counts via RPC if requested
    let flagCountMap = new Map<string, number>()
    if (enrichWithFlagCount) {
        const listingIds = (listings as any[]).map((l) => l.id)
        const flagCountResults = await Promise.all(
            listingIds.map(async (listingId) => {
                const { data: count } = await supabase.rpc("get_exchange_listing_flag_count", {
                    p_listing_id: listingId,
                    p_tenant_id: tenantId,
                })
                return { listingId, count: count ?? 0 }
            })
        )
        flagCountMap = new Map(flagCountResults.map((r) => [r.listingId, r.count]))
    }

    return listings.map((listing: any) => {
        const base: ExchangeListingWithRelations = {
            id: listing.id,
            title: listing.title,
            description: listing.description,
            type: listing.type,
            category_id: listing.category_id,
            created_by: listing.created_by,
            tenant_id: listing.tenant_id,
            status: listing.status,
            pricing_type: listing.pricing_type,
            price: listing.price,
            condition: listing.condition,
            available_quantity: listing.available_quantity,
            images: listing.images,
            hero_photo: listing.hero_photo,
            custom_location_name: listing.custom_location_name,
            custom_location_lat: listing.custom_location_lat,
            custom_location_lng: listing.custom_location_lng,
            location_id: listing.location_id,
            visibility_scope: listing.visibility_scope,
            is_available: listing.is_available,
            photos: listing.images, // Alias images to photos
            created_at: listing.created_at,
            updated_at: listing.updated_at,
            published_at: listing.published_at,
            archived_at: listing.archived_at,
            price_amount: listing.price, // Alias
        }

        if (enrichWithCategory && listing.exchange_categories) {
            base.category = listing.exchange_categories
        }

        if (enrichWithCreator && listing.creator) {
            base.creator = listing.creator
        }

        if (enrichWithLocation && listing.locations) {
            base.location = listing.locations
        }

        if (enrichWithNeighborhoods && listing.exchange_neighborhoods) {
            base.neighborhoods = listing.exchange_neighborhoods.map((n: any) => n.neighborhood)
        }

        if (enrichWithFlagCount) {
            base.flag_count = flagCountMap.get(listing.id) || 0
        }

        return base
    })
})

export async function getExchangeListingById(
    listingId: string,
    options: GetExchangeListingsOptions = {},
): Promise<ExchangeListingWithRelations | null> {
    const supabase = await createServerClient()

    const { data: listing } = await supabase.from("exchange_listings").select("tenant_id").eq("id", listingId).single()

    if (!listing) {
        return null
    }

    const listings = await getExchangeListings(listing.tenant_id, {
        ...options,
        status: undefined, // Override status filter to find specific listing
        excludeArchived: false, // Allow finding archived listings by ID
        search: undefined, // Clear search
    })

    return listings.find((l) => l.id === listingId) || null
}

export async function getExchangeCategories(tenantId: string) {
    const supabase = await createServerClient()

    const { data: categories, error } = await supabase
        .from("exchange_categories")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name")

    if (error) {
        console.error("Error fetching exchange categories:", error)
        return []
    }

    return categories || []
}
