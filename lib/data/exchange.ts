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
    status: 'active' | 'completed' | 'archived'
    price: number | null
    currency: string
    images: string[] | null
    created_at: string
    updated_at: string
}

export interface ExchangeListingWithRelations extends ExchangeListing {
    category?: {
        id: string
        name: string
        icon: string | null
    } | null
    creator?: {
        id: string
        first_name: string
        last_name: string
        profile_picture_url: string | null
    } | null
}

export interface GetExchangeListingsOptions {
    // Filter options
    type?: ('offer' | 'request')[]
    status?: ('active' | 'completed' | 'archived')[]
    categoryId?: string
    creatorId?: string
    search?: string

    // Enrichment options
    enrichWithCategory?: boolean
    enrichWithCreator?: boolean
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
        enrichWithCategory = false,
        enrichWithCreator = false,
    } = options

    const supabase = await createServerClient()

    let selectQuery = `
    id,
    title,
    description,
    type,
    category_id,
    created_by,
    tenant_id,
    status,
    price,
    currency,
    images,
    created_at,
    updated_at
  `

    if (enrichWithCategory) {
        selectQuery += `,
      exchange_categories:category_id(id, name, icon)
    `
    }

    if (enrichWithCreator) {
        selectQuery += `,
      creator:created_by(id, first_name, last_name, profile_picture_url)
    `
    }

    let query = supabase.from("exchange_listings").select(selectQuery).eq("tenant_id", tenantId)

    if (type && type.length > 0) {
        query = query.in("type", type)
    }

    if (status && status.length > 0) {
        query = query.in("status", status)
    } else {
        // Default to active listings if not specified
        query = query.eq("status", "active")
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
            price: listing.price,
            currency: listing.currency,
            images: listing.images,
            created_at: listing.created_at,
            updated_at: listing.updated_at,
        }

        if (enrichWithCategory && listing.exchange_categories) {
            base.category = listing.exchange_categories
        }

        if (enrichWithCreator && listing.creator) {
            base.creator = listing.creator
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
        status: undefined // Override status filter to find specific listing
    })

    return listings.find((l) => l.id === listingId) || null
}
