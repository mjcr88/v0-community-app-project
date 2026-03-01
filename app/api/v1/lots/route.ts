import { NextRequest, NextResponse } from 'next/server'
import { withPublicRateLimit } from '@/lib/api/public-rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { successResponse } from '@/lib/api/response'

/**
 * GET /api/v1/lots?tenant_slug=xxx
 *
 * Public endpoint returning lots for a tenant with occupancy info.
 * Rate limited by IP (10 req/60s — more generous since this is a read).
 * Returns only non-PII data: id, lot_number, is_occupied.
 * Uses service_role to bypass RLS on lots table.
 */
async function handler(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url)
        const tenantSlug = searchParams.get('tenant_slug')

        if (!tenantSlug) {
            return NextResponse.json(
                { success: false, error: { message: 'tenant_slug is required', code: 'VALIDATION_ERROR' } },
                { status: 400 }
            )
        }

        const supabase = createAdminClient()

        // 1. Resolve tenant_id from slug
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('id')
            .eq('slug', tenantSlug)
            .single()

        if (tenantError || !tenant) {
            return NextResponse.json(
                { success: false, error: { message: 'Community not found', code: 'NOT_FOUND' } },
                { status: 404 }
            )
        }

        // 2. Get all lots for tenant
        const { data: lots, error: lotsError } = await supabase
            .from('lots')
            .select('id, lot_number')
            .eq('tenant_id', tenant.id)
            .order('lot_number', { ascending: true })

        if (lotsError) {
            console.error('[lots] Query failed:', lotsError)
            return NextResponse.json(
                { success: false, error: { message: 'Failed to fetch lots', code: 'QUERY_FAILED' } },
                { status: 500 }
            )
        }

        // 3. Get occupied lot IDs (lots that have at least one resident)
        const { data: occupiedLots } = await supabase
            .from('users')
            .select('lot_id')
            .eq('tenant_id', tenant.id)
            .eq('role', 'resident')
            .not('lot_id', 'is', null)

        const occupiedLotIds = new Set(
            (occupiedLots || []).map((u) => u.lot_id).filter(Boolean)
        )

        // 4. Return lots with occupancy flag (no PII exposed)
        const lotsWithOccupancy = (lots || []).map((lot) => ({
            id: lot.id,
            lot_number: lot.lot_number,
            is_occupied: occupiedLotIds.has(lot.id),
        }))

        return successResponse(lotsWithOccupancy)

    } catch (error) {
        console.error('[lots] Unexpected error:', error)
        return NextResponse.json(
            { success: false, error: { message: 'An unexpected error occurred', code: 'INTERNAL_ERROR' } },
            { status: 500 }
        )
    }
}

// More generous rate limit for read endpoint
export const GET = withPublicRateLimit(handler, 10, '1 m')
