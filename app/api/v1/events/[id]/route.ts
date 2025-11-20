// app/api/v1/events/[id]/route.ts
import { NextRequest } from 'next/server'
import { withTenantIsolation } from '@/lib/api/middleware'
import { successResponse, errorResponse } from '@/lib/api/response'
import { getEventById } from '@/lib/data/events'
import { NotFoundError, ValidationError } from '@/lib/api/errors'

/**
 * GET /api/v1/events/:id
 * Get a single event by ID
 */
export const GET = withTenantIsolation(async (
    request: NextRequest,
    context: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params

        const event = await getEventById(id, context.tenantId)

        if (!event) {
            throw new NotFoundError(`Event ${id} not found`)
        }

        return successResponse(event)
    } catch (error) {
        console.error('[API] Get event error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to fetch event'))
    }
})

/**
 * PATCH /api/v1/events/:id
 * Update an event
 */
export const PATCH = withTenantIsolation(async (
    request: NextRequest,
    context: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params
        const body = await request.json()

        // TODO: Call updateEvent from lib/data/events once it's implemented
        throw new ValidationError('Event update not yet implemented - use app/actions/events.ts updateEvent instead')

    } catch (error) {
        console.error('[API] Update event error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to update event'))
    }
})
