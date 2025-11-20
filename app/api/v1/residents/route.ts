// app/api/v1/residents/route.ts
import { NextRequest } from 'next/server'
import { withTenantIsolation } from '@/lib/api/middleware'
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from '@/lib/api/response'
import { getResidents } from '@/lib/data/residents'
import { ValidationError } from '@/lib/api/errors'

/**
 * GET /api/v1/residents
 * List residents with pagination and filters
 */
export const GET = withTenantIsolation(async (request: NextRequest, context) => {
    try {
        const { searchParams } = new URL(request.url)
        const { page, limit, offset } = getPaginationParams(request)

        // Extract filters
        const neighborhoodId = searchParams.get('neighborhoodId') || undefined
        const lotId = searchParams.get('lotId') || undefined
        const familyUnitId = searchParams.get('familyUnitId') || undefined
        const search = searchParams.get('search') || undefined

        // Fetch residents using data layer
        const { data, total } = await getResidents({
            tenantId: context.tenantId,
            filters: {
                neighborhoodId,
                lotId,
                familyUnitId,
                search,
            },
            pagination: {
                page,
                limit,
            },
            include: {
                lot: true,
                family: true,
            },
        })

        return paginatedResponse(data, page, limit, total)
    } catch (error) {
        console.error('[API] Get residents error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to fetch residents'))
    }
})

/**
 * POST /api/v1/residents
 * Create a new resident
 */
export const POST = withTenantIsolation(async (request: NextRequest, context) => {
    try {
        // Only tenant_admin and super_admin can create residents
        if (!['tenant_admin', 'super_admin'].includes(context.userRole)) {
            throw new ValidationError('Insufficient permissions to create residents')
        }

        const body = await request.json()

        // Validate required fields
        if (!body.first_name || !body.last_name || !body.email) {
            throw new ValidationError('Missing required fields: first_name, last_name, email')
        }

        // TODO: Call createResident from lib/data/residents
        // For now, return a placeholder
        throw new ValidationError('Resident creation not yet implemented - pending lib/data/residents.createResident')

    } catch (error) {
        console.error('[API] Create resident error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to create resident'))
    }
})
