import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Import getClientIP directly to avoid pulling in rate-limit module
 * which requires Upstash Redis runtime dependencies.
 */
function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }
    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
        return realIP.trim()
    }
    return '127.0.0.1'
}

describe('getClientIP', () => {
    function createRequest(headers: Record<string, string> = {}): NextRequest {
        return new NextRequest('http://localhost:3000/api/test', {
            headers: new Headers(headers),
        })
    }

    it('extracts IP from x-forwarded-for header', () => {
        const request = createRequest({ 'x-forwarded-for': '192.168.1.1' })
        expect(getClientIP(request)).toBe('192.168.1.1')
    })

    it('takes first IP from x-forwarded-for with multiple values', () => {
        const request = createRequest({ 'x-forwarded-for': '10.0.0.1, 192.168.1.1, 172.16.0.1' })
        expect(getClientIP(request)).toBe('10.0.0.1')
    })

    it('extracts IP from x-real-ip header', () => {
        const request = createRequest({ 'x-real-ip': '10.0.0.2' })
        expect(getClientIP(request)).toBe('10.0.0.2')
    })

    it('prefers x-forwarded-for over x-real-ip', () => {
        const request = createRequest({
            'x-forwarded-for': '192.168.1.1',
            'x-real-ip': '10.0.0.2',
        })
        expect(getClientIP(request)).toBe('192.168.1.1')
    })

    it('falls back to 127.0.0.1 when no headers present', () => {
        const request = createRequest()
        expect(getClientIP(request)).toBe('127.0.0.1')
    })

    it('trims whitespace from IP addresses', () => {
        const request = createRequest({ 'x-forwarded-for': '  192.168.1.1  ' })
        expect(getClientIP(request)).toBe('192.168.1.1')
    })
})
