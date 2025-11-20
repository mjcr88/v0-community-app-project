// lib/api/response.ts
import { NextResponse } from 'next/server'
import { APIError } from './errors'

/**
 * Standardized API response utilities
 */

export interface SuccessResponse<T = any> {
    success: true
    data: T
    meta?: {
        page?: number
        limit?: number
        total?: number
        hasMore?: boolean
    }
}

export interface ErrorResponse {
    success: false
    error: {
        message: string
        code?: string
        details?: any
    }
}

/**
 * Create a success response
 */
export function successResponse<T>(
    data: T,
    meta?: SuccessResponse<T>['meta']
): NextResponse<SuccessResponse<T>> {
    return NextResponse.json({
        success: true,
        data,
        ...(meta && { meta }),
    })
}

/**
 * Create an error response
 */
export function errorResponse(
    error: Error | APIError,
    statusCode: number = 500
): NextResponse<ErrorResponse> {
    const isAPIError = error instanceof APIError

    return NextResponse.json(
        {
            success: false,
            error: {
                message: error.message,
                code: isAPIError ? error.code : 'INTERNAL_ERROR',
                ...(isAPIError && error instanceof Error && 'details' in error && {
                    details: (error as any).details
                }),
            },
        },
        { status: isAPIError ? error.statusCode : statusCode }
    )
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): NextResponse<SuccessResponse<T[]>> {
    return successResponse(data, {
        page,
        limit,
        total,
        hasMore: page * limit < total,
    })
}

/**
 * Helper to extract pagination params from URL
 */
export function getPaginationParams(request: Request): {
    page: number
    limit: number
    offset: number
} {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit

    return { page, limit, offset }
}
