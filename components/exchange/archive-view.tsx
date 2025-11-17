"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Archive, Package, History, Loader2 } from 'lucide-react'
import { getArchivedListings, getCompletedTransactions } from "@/app/actions/exchange-history"
import { ArchivedListingsTable } from "./archived-listings-table"
import { CompletedTransactionsTable } from "./completed-transactions-table"

interface ArchiveViewProps {
  userId: string
  tenantId: string
  tenantSlug: string
}

export function ArchiveView({ userId, tenantId, tenantSlug }: ArchiveViewProps) {
  const [activeTab, setActiveTab] = useState<"listings" | "transactions">("listings")
  const [archivedListings, setArchivedListings] = useState<any[]>([])
  const [completedTransactions, setCompletedTransactions] = useState<any[]>([])
  const [listingsOffset, setListingsOffset] = useState(0)
  const [transactionsOffset, setTransactionsOffset] = useState(0)
  const [listingsHasMore, setListingsHasMore] = useState(false)
  const [transactionsHasMore, setTransactionsHasMore] = useState(false)
  const [listingsTotal, setListingsTotal] = useState(0)
  const [transactionsTotal, setTransactionsTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    
    const [listingsResult, transactionsResult] = await Promise.all([
      getArchivedListings(userId, tenantId, 0, 10),
      getCompletedTransactions(userId, tenantId, 0, 10)
    ])

    setArchivedListings(listingsResult.listings)
    setListingsHasMore(listingsResult.hasMore)
    setListingsTotal(listingsResult.total)

    setCompletedTransactions(transactionsResult.transactions)
    setTransactionsHasMore(transactionsResult.hasMore)
    setTransactionsTotal(transactionsResult.total)

    setLoading(false)
  }

  const loadMoreListings = async () => {
    setLoadingMore(true)
    const newOffset = listingsOffset + 10
    
    const result = await getArchivedListings(userId, tenantId, newOffset, 10)
    
    setArchivedListings([...archivedListings, ...result.listings])
    setListingsOffset(newOffset)
    setListingsHasMore(result.hasMore)
    setLoadingMore(false)
  }

  const loadMoreTransactions = async () => {
    setLoadingMore(true)
    const newOffset = transactionsOffset + 10
    
    const result = await getCompletedTransactions(userId, tenantId, newOffset, 10)
    
    setCompletedTransactions([...completedTransactions, ...result.transactions])
    setTransactionsOffset(newOffset)
    setTransactionsHasMore(result.hasMore)
    setLoadingMore(false)
  }

  const handleListingRestored = () => {
    // Refresh the data after restoring a listing
    loadInitialData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalArchiveCount = listingsTotal + transactionsTotal

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Archive className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Archive</h3>
        <Badge variant="secondary">{totalArchiveCount} items</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "listings" | "transactions")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="listings">
            <Package className="h-4 w-4 mr-2" />
            Archived Listings ({listingsTotal})
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <History className="h-4 w-4 mr-2" />
            My History ({transactionsTotal})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-4">
          {archivedListings.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No archived listings yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Listings you archive will appear here
              </p>
            </div>
          ) : (
            <>
              <ArchivedListingsTable
                listings={archivedListings}
                userId={userId}
                tenantId={tenantId}
                tenantSlug={tenantSlug}
                onListingRestored={handleListingRestored}
              />
              
              {listingsHasMore && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={loadMoreListings}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          {completedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No completed transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your transaction history will appear here
              </p>
            </div>
          ) : (
            <>
              <CompletedTransactionsTable
                transactions={completedTransactions}
                userId={userId}
                tenantSlug={tenantSlug}
                tenantId={tenantId}
              />
              
              {transactionsHasMore && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={loadMoreTransactions}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
