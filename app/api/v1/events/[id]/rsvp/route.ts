// app/api/v1/events/[id]/rsvp/route.ts
import { NextRequest } from 'next/server'
import { withTenantIsolation } from '@/lib/api/middleware'
import { successResponse, errorResponse } from '@/lib/api/response'
import { ValidationError } from '@/lib/api/errors'

/**
 * POST /api/v1/events/:id/rsvp
 * RSVP to an event
 */
export const POST = withTenantIsolation(async (
    request: NextRequest,
    context: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params
        const body = await request.json()

        // Validate RSVP status
        if (!['yes', 'no', 'maybe'].includes(body.status)) {
            throw new ValidationError('Invalid RSVP status. Must be: yes, no, or maybe')
        }

        // TODO: Call RSVP function from lib/data/events once it's implemented
        throw new ValidationError('Event RSVP not yet implemented - use app/actions/events.ts rsvpToEvent instead')

    } catch (error) {
        console.error('[API] RSVP error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to RSVP to event'))
    }
})
