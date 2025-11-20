// app/api/v1/exchange/listings/[id]/route.ts
import { NextRequest } from 'next/server'
import { withTenantIsolation } from '@/lib/api/middleware'
import { successResponse, errorResponse } from '@/lib/api/response'
import { getExchangeListingById } from '@/lib/data/exchange'
import { NotFoundError, ValidationError } from '@/lib/api/errors'

/**
 * GET /api/v1/exchange/listings/:id
 * Get a single exchange listing by ID
 */
export const GET = withTenantIsolation(async (
    request: NextRequest,
    context: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params

        const listing = await getExchangeListingById(id, context.tenantId)

        if (!listing) {
            throw new NotFoundError(`Exchange listing ${id} not found`)
        }

        return successResponse(listing)
    } catch (error) {
        console.error('[API] Get exchange listing error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to fetch exchange listing'))
    }
})

/**
 * PATCH /api/v1/exchange/listings/:id
 * Update an exchange listing
 */
export const PATCH = withTenantIsolation(async (
    request: NextRequest,
    context: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params
        const body = await request.json()

        // TODO: Implement updateExchangeListing
        throw new ValidationError('Exchange listing update not yet implemented')

    } catch (error) {
        console.error('[API] Update exchange listing error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to update exchange listing'))
    }
})
