// lib/api/middleware.ts
import { createServerClient } from '@/lib/supabase/server'
import { AuthError, TenantIsolationError } from './errors'
import { errorResponse } from './response'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API handler type with context
 */
export type APIHandler<T = any> = (
    request: NextRequest,
    context: T
) => Promise<NextResponse>

/**
 * Authenticated user context
 */
export interface AuthContext {
    user: {
        id: string
        email: string
        role?: string
    }
}

/**
 * Tenant-isolated context
 */
export interface TenantContext extends AuthContext {
    tenantId: string
    userRole: string
}

/**
 * Authentication middleware
 * Verifies user is authenticated and adds user to context
 */
export function withAuth(
    handler: APIHandler<AuthContext>
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        try {
            const supabase = await createServerClient()
            const { data: { user }, error } = await supabase.auth.getUser()

            if (error || !user) {
                throw new AuthError('Authentication required')
            }

            // Rate limiting
            // We limit by user ID to prevent abuse from a single user
            // Default: 10 requests per 10 seconds
            try {
                const { rateLimit } = await import('@/lib/rate-limit')
                const { success, limit, remaining, reset } = await rateLimit(user.id)

                if (!success) {
                    return new NextResponse(JSON.stringify({
                        success: false,
                        error: {
                            message: 'Too many requests',
                            code: 'RATE_LIMIT_EXCEEDED'
                        }
                    }), {
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': limit.toString(),
                            'X-RateLimit-Remaining': remaining.toString(),
                            'X-RateLimit-Reset': reset.toString(),
                            'Content-Type': 'application/json'
                        }
                    })
                }
            } catch (rateLimitError) {
                // Fail open if rate limiting fails (e.g. Redis down)
                console.error('Rate limiting failed:', rateLimitError)
            }

            return handler(request, {
                user: {
                    id: user.id,
                    email: user.email || '',
                    role: user.user_metadata?.role,
                },
            })
        } catch (error) {
            if (error instanceof Error) {
                return errorResponse(error)
            }
            return errorResponse(new Error('Authentication failed'))
        }
    }
}

/**
 * Tenant isolation middleware
 * Ensures user has access to tenant and adds tenant context
 */
export function withTenantIsolation(
    handler: APIHandler<TenantContext>
) {
    return withAuth(async (request, { user }) => {
        try {
            const supabase = await createServerClient()

            // Get user's tenant information
            const { data: userData, error } = await supabase
                .from('users')
                .select('tenant_id, role')
                .eq('id', user.id)
                .single()

            if (error || !userData) {
                throw new TenantIsolationError('Unable to verify tenant access')
            }

            // Check if request includes tenantId param or query
            const { searchParams } = new URL(request.url)
            const requestedTenantId = searchParams.get('tenantId')

            // Verify user belongs to requested tenant (unless super_admin)
            if (
                requestedTenantId &&
                userData.role !== 'super_admin' &&
                requestedTenantId !== userData.tenant_id
            ) {
                throw new TenantIsolationError('Access denied to this tenant')
            }

            return handler(request, {
                user,
                tenantId: userData.tenant_id,
                userRole: userData.role,
            })
        } catch (error) {
            if (error instanceof Error) {
                return errorResponse(error)
            }
            return errorResponse(new Error('Tenant isolation check failed'))
        }
    })
}

/**
 * Role-based access control middleware
 * Checks if user has required role
 */
export function withRole(
    requiredRoles: string[],
    handler: APIHandler<TenantContext>
) {
    return withTenantIsolation(async (request, context) => {
        try {
            if (!requiredRoles.includes(context.userRole)) {
                throw new AuthError(`Required role: ${requiredRoles.join(' or ')}`)
            }

            return handler(request, context)
        } catch (error) {
            if (error instanceof Error) {
                return errorResponse(error)
            }
            return errorResponse(new Error('Role check failed'))
        }
    })
}
