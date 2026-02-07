import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateEvent, rsvpToEvent } from './events'

const { mockSupabase, mockResponseQueue } = vi.hoisted(() => {
    const queue: any[] = []

    // The Query Builder (Thenable)
    const queryBuilder: any = {
        then: vi.fn((resolve, reject) => {
            const res = queue.shift() || { data: null, error: null }
            if (resolve) resolve(res)
        })
    }

    // Builder methods return the query builder itself
    const methods = [
        'select', 'insert', 'update', 'eq', 'in', 'rpc',
        'order', 'limit', 'single', 'maybeSingle', 'upsert',
        'delete', 'or', 'gte'
    ]
    methods.forEach(m => {
        queryBuilder[m] = vi.fn().mockReturnValue(queryBuilder)
    })

    // The Client (Not Thenable)
    const client: any = {
        auth: { getUser: vi.fn() },
        from: vi.fn().mockReturnValue(queryBuilder)
    }

    return { mockSupabase: client, mockResponseQueue: queue }
})

// Mock createServerClient
vi.mock('../../lib/supabase/server', () => ({
    createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Mock revalidatePath
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('Series Events Logic', () => {
    const userId = 'user-123'
    const tenantId = 'tenant-123'
    const eventId = 'event-123'

    beforeEach(() => {
        vi.clearAllMocks()
        mockResponseQueue.length = 0

        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
        })
    })

    describe('updateEvent', () => {
        it('should propagate rsvp settings to child events in a series', async () => {
            const data = {
                title: 'Updated Series Title',
                requires_rsvp: true,
                max_attendees: 50,
                rsvp_deadline: '2025-12-31T23:59:00Z'
            }

            // Queue responses:
            // 1. Initial fetch (ownership check)
            mockResponseQueue.push({
                data: { created_by: userId, tenant_id: tenantId },
                error: null
            })

            // 2. Parent update response
            mockResponseQueue.push({ data: { id: eventId }, error: null })

            // 3. Child update response
            mockResponseQueue.push({ data: null, error: null })

            const result = await updateEvent(eventId, 'slug', tenantId, data as any)

            if (!result.success) console.error('Update failed:', result.error)
            expect(result.success).toBe(true)

            expect(mockSupabase.from).toHaveBeenCalledWith('events')

            const queryBuilder = mockSupabase.from()

            const updateCalls = queryBuilder.update.mock.calls
            expect(updateCalls.length).toBeGreaterThanOrEqual(2)

            expect(updateCalls[0][0]).toHaveProperty('title', 'Updated Series Title')

            expect(updateCalls[1][0]).not.toHaveProperty('title')
            expect(updateCalls[1][0]).toHaveProperty('requires_rsvp', true)

            const eqCalls = queryBuilder.eq.mock.calls
            expect(eqCalls).toContainEqual(['id', eventId])
            expect(eqCalls).toContainEqual(['parent_event_id', eventId])
        })

        it('should NOT propagate if rsvp settings are unchanged', async () => {
            const data = {
                title: 'Just Title Update'
            }

            // 1. Initial fetch
            mockResponseQueue.push({
                data: { created_by: userId, tenant_id: tenantId },
                error: null
            })

            // 2. Parent update response only
            mockResponseQueue.push({ data: { id: eventId }, error: null })

            await updateEvent(eventId, 'slug', tenantId, data as any)

            const queryBuilder = mockSupabase.from()
            const eqCalls = queryBuilder.eq.mock.calls
            expect(eqCalls).toContainEqual(['id', eventId])

            const hasChildUpdate = eqCalls.some(call => call[0] === 'parent_event_id')
            expect(hasChildUpdate).toBe(false)
        })
    })

    describe('rsvpToEvent with series scope', () => {
        it('should rsvp to all future events in series', async () => {
            const seriesId = 'series-parent-id'

            // Queue responses for rsvpToEvent logic:
            // 1. Fetch current event details
            mockResponseQueue.push({
                data: {
                    id: eventId,
                    parent_event_id: seriesId,
                    start_date: '2025-01-01T10:00:00Z',
                    max_attendees: 100,
                    rsvp_deadline: null,
                    requires_rsvp: true
                },
                error: null
            })

            // 2. Fetch series events
            const futureEvents = [
                { id: eventId, start_date: '2025-01-01T10:00:00Z', max_attendees: 100, rsvp_deadline: null },
                { id: 'event-456', start_date: '2025-01-08T10:00:00Z', max_attendees: 100, rsvp_deadline: null }
            ]
            mockResponseQueue.push({
                data: futureEvents,
                error: null
            })

            // 3. Fetch current RSVP counts
            mockResponseQueue.push({
                data: [],
                error: null
            })

            // 4. Upsert RSVPs
            mockResponseQueue.push({
                data: null,
                error: null
            })

            const result = await rsvpToEvent(eventId, tenantId, 'yes', 'series')

            if (!result.success) console.error('RSVP failed:', result.error)
            expect(result.success).toBe(true)

            const queryBuilder = mockSupabase.from()
            const upsertCalls = queryBuilder.upsert.mock.calls
            expect(upsertCalls.length).toBe(1)

            const upsertData = upsertCalls[0][0]
            expect(upsertData).toHaveLength(2)
            expect(upsertData[0].event_id).toBe(eventId)
            expect(upsertData[1].event_id).toBe('event-456')
            expect(upsertData[0].rsvp_status).toBe('yes')
        })
    })
})
