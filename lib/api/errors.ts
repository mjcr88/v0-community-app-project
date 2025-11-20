// lib/api/errors.ts
/**
 * Custom error classes for API responses
 */

export class APIError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message)
        this.name = 'APIError'
    }
}

export class AuthError extends APIError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'AUTH_ERROR')
        this.name = 'AuthError'
    }
}

export class ForbiddenError extends APIError {
    constructor(message: string = 'Forbidden') {
        super(message, 403, 'FORBIDDEN')
        this.name = 'ForbiddenError'
    }
}

export class NotFoundError extends APIError {
    constructor(message: string = 'Resource not found') {
        super(message, 404, 'NOT_FOUND')
        this.name = 'NotFoundError'
    }
}

export class ValidationError extends APIError {
    constructor(
        message: string,
        public details?: any
    ) {
        super(message, 400, 'VALIDATION_ERROR')
        this.name = 'ValidationError'
    }
}

export class TenantIsolationError extends APIError {
    constructor(message: string = 'Tenant isolation violation') {
        super(message, 403, 'TENANT_ISOLATION_ERROR')
        this.name = 'TenantIsolationError'
    }
}

export class RateLimitError extends APIError {
    constructor(
        message: string = 'Rate limit exceeded',
        public retryAfter?: number
    ) {
        super(message, 429, 'RATE_LIMIT_EXCEEDED')
        this.name = 'RateLimitError'
    }
}
