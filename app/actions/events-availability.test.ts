import { describe, it, expect, vi, beforeEach } from "vitest"
import { checkLocationAvailability } from "./events"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"

// Mock @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(),
}))

// Mock createServerClient for the auth check
vi.mock("@/lib/supabase/server", () => ({
    createServerClient: vi.fn(),
}))

// Mock other dependencies to avoid alias resolution issues
vi.mock("@/lib/data/events", () => ({
    getEventById: vi.fn(),
    getEvents: vi.fn(),
}))

vi.mock("@/lib/visibility-filter", () => ({
    applyVisibilityFilter: vi.fn(),
    canUserViewEvent: vi.fn(),
}))

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}))

describe("checkLocationAvailability", () => {
    let mockSupabase: any
    let mockServiceClient: any
    let mockQueryBuilder: any
    let mockResponse: any = { count: 0, error: null }

    beforeEach(() => {
        vi.clearAllMocks()
        mockResponse = { count: 0, error: null }

        // Mock Query Builder for Service Client
        mockQueryBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            then: (resolve: any, reject: any) => Promise.resolve(mockResponse).then(resolve, reject),
        }

        // Mock Service Client
        mockServiceClient = {
            from: vi.fn(() => mockQueryBuilder),
        }
            ; (createClient as any).mockReturnValue(mockServiceClient)

        // Mock Auth Client (createServerClient)
        mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { id: "user-123" } },
                    error: null,
                }),
            },
        }

            ; (createServerClient as any).mockReturnValue(mockSupabase)
    })

    const validInput = {
        locationId: "00000000-0000-0000-0000-000000000001",
        startDate: "2024-01-01",
        endDate: "2024-01-01",
        tenantId: "00000000-0000-0000-0000-000000000002",
    }

    it("should return conflict if events exist in range", async () => {
        // Setup mock response for conflict
        mockResponse = { count: 1, error: null }

        const result = await checkLocationAvailability(validInput)

        expect(result.hasConflict).toBe(true)
        expect(result.conflictCount).toBe(1)
        expect(mockServiceClient.from).toHaveBeenCalledWith("events")
        expect(mockQueryBuilder.select).toHaveBeenCalledWith("id", { count: "exact", head: true })
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith("location_id", "00000000-0000-0000-0000-000000000001")
    })

    it("should return no conflict if count is 0", async () => {
        mockResponse = { count: 0, error: null }

        const result = await checkLocationAvailability(validInput)

        expect(result.hasConflict).toBe(false)
        expect(result.conflictCount).toBe(0)
    })

    it("should exclude eventId when provided (edit mode)", async () => {
        mockResponse = { count: 0, error: null }

        await checkLocationAvailability({
            ...validInput,
            excludeEventId: "00000000-0000-0000-0000-000000000003",
        })

        expect(mockQueryBuilder.neq).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000003")
    })

    it("should apply time filters when provided", async () => {
        mockResponse = { count: 0, error: null }

        await checkLocationAvailability({
            ...validInput,
            startTime: "10:00",
            endTime: "11:00",
        })

        // Time overlap logic: (start < end_B) AND (end > start_B)
        // Implemented as: start_time.lt.endTime,end_time.gt.startTime
        // Plus handling nulls (all-day check not needed here as logic handles nulls via OR potentially)
        // The implementation uses: .or(`start_time.is.null,and(start_time.lt.${endTime},end_time.gt.${startTime})`)
        expect(mockQueryBuilder.or).toHaveBeenCalledWith(
            "start_time.is.null,and(start_time.lt.11:00,end_time.gt.10:00)"
        )
    })

    it("should return error if auth fails", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

        const result = await checkLocationAvailability(validInput)

        expect(result.error).toBe("Unauthorized")
    })

    it("should handle database errors gracefully", async () => {
        mockResponse = { count: null, error: { message: "DB Error" } }

        const result = await checkLocationAvailability(validInput)

        expect(result.error).toBe("DB Error")
    })
})
