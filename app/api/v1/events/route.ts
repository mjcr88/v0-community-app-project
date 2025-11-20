// app/api/v1/events/route.ts
import { NextRequest } from 'next/server'
import { withTenantIsolation } from '@/lib/api/middleware'
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from '@/lib/api/response'
import { getEvents } from '@/lib/data/events'
import { ValidationError } from '@/lib/api/errors'

/**
 * GET /api/v1/events
 * List events with pagination and filters
 */
export const GET = withTenantIsolation(async (request: NextRequest, context) => {
    try {
        const { searchParams } = new URL(request.url)
        const { page, limit, offset } = getPaginationParams(request)

        // Extract filters
        const categoryId = searchParams.get('categoryId') || undefined
        const startDate = searchParams.get('startDate') || undefined
        const endDate = searchParams.get('endDate') || undefined
        const visibilityScope = searchParams.get('visibilityScope') as any || undefined

        // Fetch events using data layer
        const events = await getEvents({
            tenantId: context.tenantId,
            filters: {
                categoryId,
                startDate,
                endDate,
                visibilityScope,
            },
            pagination: {
                page,
                limit,
            },
        })

        // Note: getEvents doesn't return total count yet, so we can't use paginatedResponse
        // Return simple success response for now
        return successResponse(events)
    } catch (error) {
        console.error('[API] Get events error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to fetch events'))
    }
})

/**
 * POST /api/v1/events
 * Create a new event
 */
export const POST = withTenantIsolation(async (request: NextRequest, context) => {
    try {
        const body = await request.json()

        // Validate required fields
        if (!body.title || !body.start_date) {
            throw new ValidationError('Missing required fields: title, start_date')
        }

        // TODO: Call createEvent from lib/data/events once it's implemented
        throw new ValidationError('Event creation not yet implemented - use app/actions/events.ts createEvent instead')

    } catch (error) {
        console.error('[API] Create event error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to create event'))
    }
})
