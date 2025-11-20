// app/api/v1/residents/[id]/route.ts
import { NextRequest } from 'next/server'
import { withTenantIsolation } from '@/lib/api/middleware'
import { successResponse, errorResponse } from '@/lib/api/response'
import { NotFoundError, ValidationError } from '@/lib/api/errors'

/**
 * GET /api/v1/residents/:id
 * Get a single resident by ID
 */
export const GET = withTenantIsolation(async (
    request: NextRequest,
    context: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params

        // TODO: Call getResident from lib/data/residents once it's implemented
        // For now, return placeholder
        throw new NotFoundError(`Resident ${id} not found - getResident not yet implemented`)

    } catch (error) {
        console.error('[API] Get resident error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to fetch resident'))
    }
})

/**
 * PATCH /api/v1/residents/:id
 * Update a resident
 */
export const PATCH = withTenantIsolation(async (
    request: NextRequest,
    context: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params
        const body = await request.json()

        // TODO: Call updateResident from lib/data/residents once it's implemented
        // For now, return placeholder
        throw new ValidationError(`Resident update not yet implemented - updateResident needs to be added to lib/data/residents`)

    } catch (error) {
        console.error('[API] Update resident error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to update resident'))
    }
})
