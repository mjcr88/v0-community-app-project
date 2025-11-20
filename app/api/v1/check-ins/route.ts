// app/api/v1/check-ins/route.ts
import { NextRequest } from 'next/server'
import { withTenantIsolation } from '@/lib/api/middleware'
import { successResponse, errorResponse, getPaginationParams } from '@/lib/api/response'
import { getCheckIns } from '@/lib/data/check-ins'
import { ValidationError } from '@/lib/api/errors'

/**
 * GET /api/v1/check-ins
 * List check-ins with filters
 */
export const GET = withTenantIsolation(async (request: NextRequest, context) => {
    try {
        const { searchParams } = new URL(request.url)
        const { page, limit } = getPaginationParams(request)

        // Extract filters
        const locationId = searchParams.get('locationId') || undefined
        const userId = searchParams.get('userId') || undefined

        // Fetch check-ins using data layer
        const checkIns = await getCheckIns({
            tenantId: context.tenantId,
            filters: {
                locationId,
                userId,
            },
            pagination: {
                page,
                limit,
            },
        })

        return successResponse(checkIns)
    } catch (error) {
        console.error('[API] Get check-ins error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to fetch check-ins'))
    }
})

/**
 * POST /api/v1/check-ins
 * Create a new check-in
 */
export const POST = withTenantIsolation(async (request: NextRequest, context) => {
    try {
        const body = await request.json()

        // Validate required fields
        if (!body.location_id) {
            throw new ValidationError('Missing required field: location_id')
        }

        // TODO: Use createCheckIn from app/actions/check-ins.ts
        throw new ValidationError('Check-in creation not yet implemented in API - use app/actions/check-ins.ts instead')

    } catch (error) {
        console.error('[API] Create check-in error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to create check-in'))
    }
})
