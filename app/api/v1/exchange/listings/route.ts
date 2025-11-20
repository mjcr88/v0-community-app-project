// app/api/v1/exchange/listings/route.ts
import { NextRequest } from 'next/server'
import { withTenantIsolation } from '@/lib/api/middleware'
import { successResponse, errorResponse, getPaginationParams } from '@/lib/api/response'
import { getExchangeListings } from '@/lib/data/exchange'
import { ValidationError } from '@/lib/api/errors'

/**
 * GET /api/v1/exchange/listings
 * List exchange listings with filters
 */
export const GET = withTenantIsolation(async (request: NextRequest, context) => {
    try {
        const { searchParams } = new URL(request.url)
        const { page, limit } = getPaginationParams(request)

        // Extract filters
        const categoryId = searchParams.get('categoryId') || undefined
        const listingType = searchParams.get('listingType') as any || undefined
        const search = searchParams.get('search') || undefined

        // Fetch listings using data layer
        const listings = await getExchangeListings({
            tenantId: context.tenantId,
            filters: {
                categoryId,
                listingType,
                search,
            },
            pagination: {
                page,
                limit,
            },
        })

        return successResponse(listings)
    } catch (error) {
        console.error('[API] Get exchange listings error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to fetch exchange listings'))
    }
})

/**
 * POST /api/v1/exchange/listings
 * Create a new exchange listing
 */
export const POST = withTenantIsolation(async (request: NextRequest, context) => {
    try {
        const body = await request.json()

        // Validate required fields
        if (!body.title || !body.listing_type || !body.category_id) {
            throw new ValidationError('Missing required fields: title, listing_type, category_id')
        }

        // TODO: Use createExchangeListing from app/actions/exchange-listings.ts
        throw new ValidationError('Exchange listing creation not yet implemented in API - use app/actions/exchange-listings.ts instead')

    } catch (error) {
        console.error('[API] Create exchange listing error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to create exchange listing'))
    }
})
