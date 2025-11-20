// app/api/v1/locations/[id]/route.ts
import { NextRequest } from 'next/server'
import { withTenantIsolation } from '@/lib/api/middleware'
import { successResponse, errorResponse } from '@/lib/api/response'
import { getLocationById } from '@/lib/data/locations'
import { NotFoundError, ValidationError } from '@/lib/api/errors'

/**
 * GET /api/v1/locations/:id
 * Get a single location by ID
 */
export const GET = withTenantIsolation(async (
    request: NextRequest,
    context: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params

        const location = await getLocationById(id, context.tenantId)

        if (!location) {
            throw new NotFoundError(`Location ${id} not found`)
        }

        return successResponse(location)
    } catch (error) {
        console.error('[API] Get location error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to fetch location'))
    }
})

/**
 * PATCH /api/v1/locations/:id
 * Update a location
 */
export const PATCH = withTenantIsolation(async (
    request: NextRequest,
    context: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params
        const body = await request.json()

        // TODO: Implement updateLocation in lib/data/locations
        throw new ValidationError('Location update not yet implemented')

    } catch (error) {
        console.error('[API] Update location error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to update location'))
    }
})
