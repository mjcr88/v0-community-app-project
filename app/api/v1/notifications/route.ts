// app/api/v1/notifications/route.ts
import { NextRequest } from 'next/server'
import { withTenantIsolation } from '@/lib/api/middleware'
import { successResponse, errorResponse, getPaginationParams } from '@/lib/api/response'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/v1/notifications
 * List user's notifications
 */
export const GET = withTenantIsolation(async (request: NextRequest, context) => {
    try {
        const { searchParams } = new URL(request.url)
        const { page, limit, offset } = getPaginationParams(request)
        const unreadOnly = searchParams.get('unreadOnly') === 'true'

        const supabase = await createServerClient()

        let query = supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('recipient_id', context.user.id)
            .eq('tenant_id', context.tenantId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (unreadOnly) {
            query = query.eq('is_read', false)
        }

        const { data, error, count } = await query

        if (error) {
            throw error
        }

        return successResponse(data, {
            page,
            limit,
            total: count || 0,
            hasMore: (count || 0) > offset + limit,
        })
    } catch (error) {
        console.error('[API] Get notifications error:', error)
        return errorResponse(error instanceof Error ? error : new Error('Failed to fetch notifications'))
    }
})
