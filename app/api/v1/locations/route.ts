// app/api/v1/locations/route.ts
import { NextRequest } from 'next/server'
import { withTenantIsolation } from '@/lib/api/middleware'
import { successResponse, errorResponse, getPaginationParams } from '@/lib/api/response'
import { getLocations } from '@/lib/data/locations'
import { ValidationError } from '@/lib/api/errors'

/**
 * GET /api/v1/locations
 * List locations with filters
 */
export const GET = withTenantIsolation(async (request: NextRequest, context) => {
    try {
        const { searchParams } = new URL(request.url)

        // Extract filters
        const type = searchParams.get('type') as any || undefined
        const neighborhoodId = searchParams.get('neighborhoodId') || undefined

        // Fetch locations using data layer
        const locations = await getLocations(
            context.tenantId,
            type ? [type] : undefined,
            neighborhoodId
        )

        return successResponse(locations)
    } catch (error) {
        console.error('[API] Get locations error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to fetch locations'))
    }
})

/**
 * POST /api/v1/locations
 * Create a new location
 */
export const POST = withTenantIsolation(async (request: NextRequest, context) => {
    try {
        // Only tenant_admin and super_admin can create locations
        if (!['tenant_admin', 'super_admin'].includes(context.userRole)) {
            throw new ValidationError('Insufficient permissions to create locations')
        }

        const body = await request.json()

        // Validate required fields
        if (!body.name || !body.type) {
            throw new ValidationError('Missing required fields: name, type')
        }

        // TODO: Implement createLocation in lib/data/locations
        throw new ValidationError('Location creation not yet implemented')

    } catch (error) {
        console.error('[API] Create location error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to create location'))
    }
})
