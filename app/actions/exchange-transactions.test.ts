import { describe, it, expect, vi, beforeEach } from "vitest"
import { markItemPickedUp, cancelTransaction } from "./exchange-transactions"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"

// Define a singleton mock Supabase client that we can control in tests
const mockSupabase = {
    auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
    },
    from: vi.fn(), // We will override this in beforeEach
}

// Mock @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => {
    return {
        createClient: vi.fn(() => mockSupabase),
    }
})

// Mock createServerClient
vi.mock("@/lib/supabase/server", () => {
    return {
        createClient: vi.fn(() => Promise.resolve(mockSupabase)),
        createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
    }
})

// Mock notifications (to avoid dependency issues)
vi.mock("./notifications", () => ({
    createNotification: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}))

describe("exchange-transactions", () => {
    let mockQueryBuilder: any

    beforeEach(() => {
        vi.clearAllMocks()

        // Create a fresh mock builder factory
        const createMockBuilder = () => {
            const builder: any = {
                select: vi.fn(),
                eq: vi.fn(),
                single: vi.fn(),
                maybeSingle: vi.fn(),
                update: vi.fn(),
            }
            // Setup chaining
            builder.select.mockReturnValue(builder)
            builder.eq.mockReturnValue(builder)
            builder.single.mockResolvedValue({ data: null, error: null })
            builder.maybeSingle.mockResolvedValue({ data: null, error: null })
            builder.update.mockReturnValue(builder) // Support chaining .update().eq()

            // Allow awaiting the builder directly if needed (though usually we await specific methods)
            // But usually we await .single() or .update() or .select()
            // If the code awaits the builder itself (like `await query`), we need `then`.
            builder.then = (resolve: any) => resolve({ data: null, error: null })

            return builder
        }

        // Assign the factory to the global mock
        mockSupabase.from = vi.fn(() => createMockBuilder())
    })

    describe("markItemPickedUp", () => {
        const mockTransaction = {
            id: "tx-1",
            listing_id: "list-1",
            borrower_id: "user-1",
            lender_id: "user-2",
            quantity: 1,
            status: "confirmed",
            tenant_id: "tenant-1",
            exchange_listings: {
                title: "Test Item",
                exchange_categories: { name: "Services & Skills" }, // Default: Service
            },
            borrower: { first_name: "John", last_name: "Doe" },
            lender: { first_name: "Jane", last_name: "Doe" },
        }

        it("should restore inventory for Services & Skills", async () => {
            // We need to control the responses for specific tables.
            // Since .from() returns a NEW builder each time, we need to inspect the calls.
            // OR we can make the mock smarter to return specific data based on table name.

            const transactionBuilder = {
                select: vi.fn(),
                eq: vi.fn(),
                single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
                update: vi.fn(),
            } as any
            transactionBuilder.select.mockReturnValue(transactionBuilder)
            transactionBuilder.eq.mockReturnValue(transactionBuilder)
            transactionBuilder.update.mockReturnValue(transactionBuilder)
            transactionBuilder.then = (resolve: any) => resolve({ data: null, error: null })

            const listingBuilder = {
                select: vi.fn(),
                eq: vi.fn(),
                single: vi.fn().mockResolvedValue({ data: { available_quantity: 5 }, error: null }),
                update: vi.fn(),
            } as any
            listingBuilder.select.mockReturnValue(listingBuilder)
            listingBuilder.eq.mockReturnValue(listingBuilder)
            listingBuilder.update.mockReturnValue(listingBuilder)
            listingBuilder.then = (resolve: any) => resolve({ data: null, error: null })

            // Configure behavior based on table name
            mockSupabase.from.mockImplementation((tableName: string) => {
                if (tableName === "exchange_transactions") return transactionBuilder
                if (tableName === "exchange_listings") return listingBuilder
                return transactionBuilder // Default
            })

            await markItemPickedUp("tx-1", "user-1", "tenant-1", "slug")

            // Verify Listing Update was called
            expect(mockSupabase.from).toHaveBeenCalledWith("exchange_listings")
            expect(listingBuilder.update).toHaveBeenCalledWith({
                available_quantity: 6, // 5 + 1
                is_available: true,
            })
        })

        it("should NOT restore inventory for Food & Produce", async () => {
            const foodTransaction = {
                ...mockTransaction,
                exchange_listings: {
                    ...mockTransaction.exchange_listings,
                    exchange_categories: { name: "Food & Produce" },
                },
            }

            const transactionBuilder = {
                select: vi.fn(),
                eq: vi.fn(),
                single: vi.fn().mockResolvedValue({ data: foodTransaction, error: null }),
                update: vi.fn(),
            } as any
            transactionBuilder.select.mockReturnValue(transactionBuilder)
            transactionBuilder.eq.mockReturnValue(transactionBuilder)
            transactionBuilder.update.mockReturnValue(transactionBuilder)
            transactionBuilder.then = (resolve: any) => resolve({ data: null, error: null })

            const listingBuilder = {
                select: vi.fn(),
                update: vi.fn(),
            } // Should not be called

            mockSupabase.from.mockImplementation((tableName: string) => {
                if (tableName === "exchange_transactions") return transactionBuilder
                if (tableName === "exchange_listings") return listingBuilder
                return transactionBuilder
            })

            await markItemPickedUp("tx-1", "user-1", "tenant-1", "slug")

            // Verify Listing Update was NOT called
            expect(mockSupabase.from).not.toHaveBeenCalledWith("exchange_listings")
        })
    })

    describe("cancelTransaction", () => {
        const mockTransaction = {
            id: "tx-1",
            listing_id: "list-1",
            borrower_id: "user-1",
            lender_id: "user-2",
            quantity: 1,
            status: "confirmed",
            tenant_id: "tenant-1",
            exchange_listings: {
                title: "Test Item",
                exchange_categories: { name: "Food & Produce" },
            },
        }

        it("should restore inventory for Food when CANCELLED before pickup", async () => {
            const transactionBuilder = {
                select: vi.fn(),
                eq: vi.fn(),
                single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
                update: vi.fn(),
            } as any
            transactionBuilder.select.mockReturnValue(transactionBuilder)
            transactionBuilder.eq.mockReturnValue(transactionBuilder)
            transactionBuilder.update.mockReturnValue(transactionBuilder)
            transactionBuilder.then = (resolve: any) => resolve({ data: null, error: null })

            const listingBuilder = {
                select: vi.fn(),
                eq: vi.fn(),
                single: vi.fn().mockResolvedValue({ data: { available_quantity: 5 }, error: null }),
                update: vi.fn(),
            } as any
            listingBuilder.select.mockReturnValue(listingBuilder)
            listingBuilder.eq.mockReturnValue(listingBuilder)
            listingBuilder.update.mockReturnValue(listingBuilder)
            listingBuilder.then = (resolve: any) => resolve({ data: null, error: null })

            mockSupabase.from.mockImplementation((tableName: string) => {
                if (tableName === "exchange_transactions") return transactionBuilder
                if (tableName === "exchange_listings") return listingBuilder
                return transactionBuilder
            })

            await cancelTransaction("tx-1", "user-1", "tenant-1", "slug")

            // Verify Listing Update WAS called
            expect(mockSupabase.from).toHaveBeenCalledWith("exchange_listings")
            expect(listingBuilder.update).toHaveBeenCalledWith({
                available_quantity: 6, // 5 + 1
                is_available: true,
            })
        })
    })
})
