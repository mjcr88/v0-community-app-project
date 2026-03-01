import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Public rate limit middleware for unauthenticated endpoints.
 * Limits by client IP address instead of user ID.
 * Default: 3 requests per 60 seconds per IP.
 */
export type PublicAPIHandler = (request: NextRequest) => Promise<NextResponse>

export function withPublicRateLimit(
    handler: PublicAPIHandler,
    limit: number = 3,
    window: `${number} s` | `${number} m` | `${number} h` | `${number} d` = '1 m'
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        try {
            const ip = getClientIP(request)
            const identifier = `public:${ip}`

            const result = await rateLimit(identifier, limit, window)

            if (!result.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            message: 'Too many requests. Please try again later.',
                            code: 'RATE_LIMIT_EXCEEDED',
                        },
                    },
                    {
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': result.limit.toString(),
                            'X-RateLimit-Remaining': result.remaining.toString(),
                            'X-RateLimit-Reset': result.reset.toString(),
                            'Retry-After': '60',
                        },
                    }
                )
            }

            return handler(request)
        } catch (error) {
            // Fail open: if rate limiting infrastructure is down, allow the request
            console.error('[public-rate-limit] Rate limiting failed:', error)
            return handler(request)
        }
    }
}

/**
 * Extract client IP from request headers.
 * Checks common proxy headers in priority order.
 */
export function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
        // x-forwarded-for can contain multiple IPs; take the first (client IP)
        return forwarded.split(',')[0].trim()
    }

    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
        return realIP.trim()
    }

    // Fallback for local development
    return '127.0.0.1'
}
