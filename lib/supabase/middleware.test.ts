import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateSession } from './middleware'
import { NextResponse, NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn()
}))

// Mock Next.js Server Classes
const mockNextResponse = {
    next: vi.fn(),
    redirect: vi.fn(),
    cookies: {
        set: vi.fn(),
        get: vi.fn(),
        getAll: vi.fn().mockReturnValue([]),
    }
}

vi.mock('next/server', () => {
    return {
        NextResponse: {
            next: vi.fn(() => mockNextResponse),
            redirect: vi.fn(() => mockNextResponse),
        },
        NextRequest: class {
            cookies: any
            nextUrl: any
            constructor(url: string, init?: any) {
                this.cookies = init?.cookies || {
                    get: vi.fn(),
                    getAll: vi.fn(),
                    set: vi.fn(),
                }
                this.nextUrl = new URL(url)
            }
        }
    }
})

describe('Middleware Auto-Logout Logic', () => {
    let mockSupabase: any
    let mockUser: any

    beforeEach(() => {
        vi.clearAllMocks()

        // Default User Setup
        mockUser = {
            id: 'test-user',
            last_sign_in_at: new Date().toISOString() // Brand new session
        }

        mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
                signOut: vi.fn()
            }
        }

        // @ts-ignore
        createServerClient.mockReturnValue(mockSupabase)

        // Mock Env Vars
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    })

    it('should allow access if user is logged in and grace period applies (fresh login)', async () => {
        const req = new NextRequest('http://localhost:3000/dashboard', {
            cookies: {
                get: (name: string) => {
                    if (name === 'last-active') return undefined // No cookie yet
                    if (name === 'remember-me') return undefined
                },
                getAll: () => []
            }
        })

        await updateSession(req)

        // Should NOT sign out
        expect(mockSupabase.auth.signOut).not.toHaveBeenCalled()
        // Should NOT redirect
        expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('should logout if session is old and no last-active cookie (stale session)', async () => {
        // User logged in 3 hours ago
        mockUser.last_sign_in_at = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()

        const req = new NextRequest('http://localhost:3000/dashboard', {
            cookies: {
                get: (name: string) => undefined,
                getAll: () => []
            }
        })

        await updateSession(req)

        // Should sign out
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
        // Should redirect
        expect(NextResponse.redirect).toHaveBeenCalled()
    })

    it('should allow access if last-active cookie is valid', async () => {
        // User logged in 3 hours ago (so grace period fails)
        mockUser.last_sign_in_at = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()

        const req = new NextRequest('http://localhost:3000/dashboard', {
            cookies: {
                get: (name: string) => {
                    if (name === 'last-active') return { value: Date.now().toString() } // Active just now
                    return undefined
                },
                getAll: () => []
            }
        })

        await updateSession(req)

        expect(mockSupabase.auth.signOut).not.toHaveBeenCalled()
    })
})
