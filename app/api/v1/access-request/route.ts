import { NextRequest, NextResponse } from 'next/server'
import { withPublicRateLimit } from '@/lib/api/public-rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { accessRequestAPISchema } from '@/lib/validation/access-request-schema'
import { errorResponse, successResponse } from '@/lib/api/response'
import { ValidationError } from '@/lib/api/errors'

/**
 * POST /api/v1/access-request
 *
 * Public endpoint for prospective residents to request access.
 * - Rate limited by IP (3 req/60s)
 * - Validates input with Zod
 * - Resolves tenant_id from tenant_slug server-side
 * - Checks feature flag
 * - Validates lot belongs to tenant
 * - Checks for duplicate pending requests
 * - Inserts into access_requests using service_role
 */
async function handler(request: NextRequest): Promise<NextResponse> {
    try {
        // 1. Parse and validate body
        const body = await request.json().catch(() => ({}))
        const parseResult = accessRequestAPISchema.safeParse(body)

        if (!parseResult.success) {
            const firstError = parseResult.error.errors[0]
            throw new ValidationError(
                firstError?.message || 'Invalid request data',
                parseResult.error.flatten().fieldErrors
            )
        }

        const { tenant_slug, email, first_name, last_name, family_name, lot_id, in_costa_rica } = parseResult.data
        const supabase = createAdminClient()

        // 2. Resolve tenant_id from slug (server-side — prevents cross-tenant injection)
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('id')
            .eq('slug', tenant_slug)
            .single()

        if (tenantError || !tenant) {
            return NextResponse.json(
                { success: false, error: { message: 'Community not found', code: 'NOT_FOUND' } },
                { status: 404 }
            )
        }

        // 3. Check feature flag (graceful: defaults to true if column doesn't exist yet)
        const { data: tenantFlags } = await supabase
            .from('tenants')
            .select('access_requests_enabled')
            .eq('id', tenant.id)
            .maybeSingle()

        const accessRequestsEnabled = tenantFlags?.access_requests_enabled ?? true

        if (!accessRequestsEnabled) {
            return NextResponse.json(
                { success: false, error: { message: 'Access requests are not available for this community', code: 'FEATURE_DISABLED' } },
                { status: 403 }
            )
        }

        // 4. Validate lot belongs to tenant (if provided)
        if (lot_id && lot_id !== '') {
            const { data: lot, error: lotError } = await supabase
                .from('lots')
                .select('id')
                .eq('id', lot_id)
                .eq('tenant_id', tenant.id)
                .single()

            if (lotError || !lot) {
                throw new ValidationError('Selected lot does not belong to this community')
            }
        }

        // 5. Check for duplicate pending request
        const { data: existing } = await supabase
            .from('access_requests')
            .select('id')
            .eq('tenant_id', tenant.id)
            .ilike('email', email)
            .eq('status', 'pending')
            .maybeSingle()

        if (existing) {
            return NextResponse.json(
                { success: false, error: { message: 'A request for this email already exists', code: 'DUPLICATE_REQUEST' } },
                { status: 409 }
            )
        }

        // 6. Insert access request
        const { error: insertError } = await supabase
            .from('access_requests')
            .insert({
                tenant_id: tenant.id,
                email,
                first_name,
                last_name,
                family_name: family_name || null,
                lot_id: (lot_id && lot_id !== '') ? lot_id : null,
                in_costa_rica,
                status: 'pending',
            })

        if (insertError) {
            console.error('[access-request] Insert failed:', insertError)
            return NextResponse.json(
                { success: false, error: { message: 'Failed to submit request', code: 'INSERT_FAILED' } },
                { status: 500 }
            )
        }

        // 7. Return success
        return successResponse({ message: 'Your request has been submitted. An administrator will review it shortly.' })

    } catch (error) {
        if (error instanceof Error) {
            return errorResponse(error)
        }
        return errorResponse(new Error('An unexpected error occurred'))
    }
}

export const POST = withPublicRateLimit(handler)
