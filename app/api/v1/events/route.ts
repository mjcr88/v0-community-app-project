// app/api/v1/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
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
        const events = await getEvents(context.tenantId, {
            categoryId,
            startDate,
            endDate,
            visibilityScope,
            limit,
            offset,
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

        // Validate input using Zod schema
        const { eventSchema } = await import('@/lib/validation/schemas')
        const validationResult = eventSchema.safeParse(body)

        if (!validationResult.success) {
            // Format validation errors
            const errors = validationResult.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }))

            return new NextResponse(JSON.stringify({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors
                }
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // TODO: Call createEvent from lib/data/events once it's implemented
        // For now, we just return the validated data to show it worked
        // throw new ValidationError('Event creation not yet implemented - use app/actions/events.ts createEvent instead')

        return successResponse({
            message: 'Validation successful (Simulation)',
            data: validationResult.data
        })

    } catch (error) {
        console.error('[API] Create event error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to create event'))
    }
})
