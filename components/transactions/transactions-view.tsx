"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionCard } from "./transaction-card"
import { Package } from 'lucide-react'

export interface Transaction {
  id: string
  tenant_id: string
  listing_id: string
  borrower_id: string
  lender_id: string
  quantity: number
  status: string
  proposed_pickup_date: string | null
  proposed_return_date: string | null
  confirmed_pickup_date: string | null
  expected_return_date: string | null
  actual_pickup_date: string | null
  actual_return_date: string | null
  borrower_message: string | null
  lender_message: string | null
  rejection_reason: string | null
  return_condition: string | null
  return_notes: string | null
  return_damage_photo_url: string | null
  created_at: string
  updated_at: string
  confirmed_at: string | null
  rejected_at: string | null
  completed_at: string | null
  exchange_listings: {
    id: string
    title: string
    hero_photo: string | null
    category_id: string
    exchange_categories: {
      id: string
      name: string
    } | null
  } | null
  borrower: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  } | null
  lender: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  } | null
}

interface TransactionsViewProps {
  transactions: Transaction[]
  userId: string
  tenantSlug: string
  tenantId: string
  highlightTransactionId?: string | null
}

export function TransactionsView({
  transactions,
  userId,
  tenantSlug,
  tenantId,
  highlightTransactionId
}: TransactionsViewProps) {
  // Filter active and completed transactions
  console.log("[v0] All transactions:", transactions.map(t => ({ id: t.id, status: t.status, listing: t.exchange_listings?.title })))

  const active = transactions.filter((t) =>
    ["requested", "confirmed", "picked_up", "returned"].includes(t.status)
  )
  const completed = transactions.filter((t) => t.status === "completed")

  console.log("[v0] Active transactions:", active.length, active.map(t => ({ id: t.id, status: t.status })))
  console.log("[v0] Completed transactions:", completed.length, completed.map(t => ({ id: t.id, status: t.status })))

  // Separate by role
  const activeBorrowing = active.filter((t) => t.borrower_id === userId)
  const activeLending = active.filter((t) => t.lender_id === userId)
  const completedBorrowing = completed.filter((t) => t.borrower_id === userId)
  const completedLending = completed.filter((t) => t.lender_id === userId)

  console.log("[v0] Active lending:", activeLending.length, "Active borrowing:", activeBorrowing.length)

  function renderEmptyState(message: string) {
    return (
      <div className="text-center py-12">
        <img
          src="/rio/rio_no_results_confused.png"
          alt="No transactions"
          className="h-24 w-24 mx-auto mb-4 object-contain"
        />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({completed.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="mt-4 space-y-6">
        {active.length === 0 ? (
          renderEmptyState("No active transactions")
        ) : (
          <>
            {/* Borrowing Section */}
            {activeBorrowing.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Borrowing ({activeBorrowing.length})
                </h3>
                <div className="space-y-3">
                  {activeBorrowing.map((tx) => (
                    <TransactionCard
                      key={tx.id}
                      transaction={tx}
                      role="borrower"
                      userId={userId}
                      tenantSlug={tenantSlug}
                      tenantId={tenantId}
                      highlighted={highlightTransactionId === tx.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Lending Section */}
            {activeLending.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Lending ({activeLending.length})
                </h3>
                <div className="space-y-3">
                  {activeLending.map((tx) => (
                    <TransactionCard
                      key={tx.id}
                      transaction={tx}
                      role="lender"
                      userId={userId}
                      tenantSlug={tenantSlug}
                      tenantId={tenantId}
                      highlighted={highlightTransactionId === tx.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </TabsContent>

      <TabsContent value="completed" className="mt-4 space-y-6">
        {completed.length === 0 ? (
          renderEmptyState("No completed transactions")
        ) : (
          <>
            {/* Borrowing Section */}
            {completedBorrowing.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Borrowed ({completedBorrowing.length})
                </h3>
                <div className="space-y-3">
                  {completedBorrowing.map((tx) => (
                    <TransactionCard
                      key={tx.id}
                      transaction={tx}
                      role="borrower"
                      userId={userId}
                      tenantSlug={tenantSlug}
                      tenantId={tenantId}
                      highlighted={highlightTransactionId === tx.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Lending Section */}
            {completedLending.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Lent ({completedLending.length})
                </h3>
                <div className="space-y-3">
                  {completedLending.map((tx) => (
                    <TransactionCard
                      key={tx.id}
                      transaction={tx}
                      role="lender"
                      userId={userId}
                      tenantSlug={tenantSlug}
                      tenantId={tenantId}
                      highlighted={highlightTransactionId === tx.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
  )
}
