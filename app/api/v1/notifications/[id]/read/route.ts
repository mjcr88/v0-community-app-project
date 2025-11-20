// app/api/v1/notifications/[id]/read/route.ts
import { NextRequest } from 'next/server'
import { withTenantIsolation } from '@/lib/api/middleware'
import { successResponse, errorResponse } from '@/lib/api/response'
import { createServerClient } from '@/lib/supabase/server'
import { NotFoundError } from '@/lib/api/errors'

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a notification as read
 */
export const PATCH = withTenantIsolation(async (
    request: NextRequest,
    context: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params
        const supabase = await createServerClient()

        // Update notification
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', id)
            .eq('recipient_id', context.user.id) // Ensure user owns this notification
            .select()
            .single()

        if (error) {
            throw error
        }

        if (!data) {
            throw new NotFoundError(`Notification ${id} not found`)
        }

        return successResponse(data)
    } catch (error) {
        console.error('[API] Mark notification read error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to mark notification as read'))
    }
})
