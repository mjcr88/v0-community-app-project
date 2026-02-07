import { describe, it, expect, vi, beforeEach } from "vitest"
import { createServerClient } from "@/lib/supabase/server"
import { rsvpToEvent } from "./events"

// Mock dependencies
vi.mock("@/lib/supabase/server", () => ({
    createServerClient: vi.fn(),
}))

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}))

// Mock event visibility check
vi.mock("@/lib/visibility-filter", () => ({
    applyVisibilityFilter: vi.fn((query) => query),
    canUserViewEvent: vi.fn().mockResolvedValue(true),
}))

describe("Event Series Actions", () => {
    let mockSupabase: any
    let queryResponseSequence: any[] = []

    beforeEach(() => {
        vi.clearAllMocks()
        queryResponseSequence = []

        // Create a mock query builder that consumes the response sequence
        const mockQueryBuilder: any = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            like: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            // The then method makes this object awaitable
            then: (resolve: any, reject: any) => {
                if (queryResponseSequence.length === 0) {
                    console.warn("Mock Supabase client ran out of responses!")
                    return Promise.resolve({ error: { message: "Unexpected call - ran out of responses" } }).then(resolve, reject)
                }
                const response = queryResponseSequence.shift()
                return Promise.resolve(response).then(resolve, reject)
            }
        }

        mockSupabase = {
            auth: {
                getUser: vi.fn(),
            },
            from: vi.fn(() => mockQueryBuilder),
        }

            ; (createServerClient as any).mockReturnValue(mockSupabase)
    })

    describe("rsvpToEvent with scope='series'", () => {
        it("should apply RSVP to all future occurrences in the series", async () => {
            const parentEventId = "parent-123"
            const currentEventId = "event-1"
            const futureEventId = "event-2"
            const userId = "user-123"
            const tenantId = "tenant-123"

            // 1. Mock auth user
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: userId } },
                error: null,
            })

            // Setup sequence of usage in rsvpToEvent
            queryResponseSequence = [
                // 1. Get Event Details
                {
                    data: {
                        id: currentEventId,
                        parent_event_id: parentEventId,
                        start_date: "2024-01-01T10:00:00Z",
                        requires_rsvp: true,
                    },
                    error: null,
                },
                // 2. Get Future Events (Series check)
                {
                    data: [
                        { id: currentEventId, start_date: "2024-01-01T10:00:00Z", max_attendees: null, rsvp_deadline: null },
                        { id: futureEventId, start_date: "2024-02-01T10:00:00Z", max_attendees: null, rsvp_deadline: null }
                    ],
                    error: null,
                },
                // 3. Get Detailed Counts (Capacity check - for 'yes' status)
                {
                    data: [], // No current attendees
                    error: null
                },
                // 4. Get User RSVPs (Capacity check - check if user already attending)
                {
                    data: [], // User not attending yet
                    error: null
                },
                // 5. Bulk Upsert
                { error: null },
                // 6. Get Tenant (for revalidation)
                { data: { slug: "my-tenant" }, error: null }
            ]

            const result = await rsvpToEvent(currentEventId, tenantId, "yes", "series")

            // If result.success is false, identifying the error is helpful
            if (!result.success) {
                console.error("Test failed result:", result)
            }

            expect(result.success).toBe(true)

            // Check that upsert was called ONCE with 2 items
            const upsertSpy = mockSupabase.from().upsert
            expect(upsertSpy).toHaveBeenCalledTimes(1)

            const upsertCallArgs = upsertSpy.mock.calls[0][0]
            expect(upsertCallArgs).toHaveLength(2)
            expect(upsertCallArgs).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ event_id: currentEventId, rsvp_status: "yes" }),
                    expect.objectContaining({ event_id: futureEventId, rsvp_status: "yes" })
                ])
            )
        })
    })
})
