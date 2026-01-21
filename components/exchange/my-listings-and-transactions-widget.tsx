"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Plus, Pencil, Pause, Play, Eye, FileText, Trash2, Archive, History } from 'lucide-react'
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { pauseExchangeListing, publishDraftListing, deleteExchangeListing } from "@/app/actions/exchange-listings"
import { archiveListing } from "@/app/actions/exchange-history"
import { ExchangeListingDetailModal } from "./exchange-listing-detail-modal"
import { EditExchangeListingModal } from "./edit-exchange-listing-modal"
import { CreateExchangeListingButton } from "./create-exchange-listing-button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RioConfirmationModal } from "@/components/feedback/rio-confirmation-modal"
import Image from "next/image"
import type { Location } from "@/types/locations"
import { TransactionsView } from "@/components/transactions/transactions-view"
import { ArchiveView } from "./archive-view"
import { ListingHistoryModal } from "./listing-history-modal"

interface ListingCategory {
  id: string
  name: string
}

interface ListingLocation {
  id: string
  name: string
}

interface Listing {
  id: string
  title: string
  status: "draft" | "published" | "paused" | "cancelled"
  is_available: boolean
  pricing_type: "free" | "fixed_price" | "negotiable"
  price: number | null
  photos: string[]
  hero_photo: string | null
  available_quantity: number
  category: ListingCategory | null
  location: ListingLocation | null
  created_at: string
  published_at: string | null
  archived_at: string | null
}

import { Transaction } from "@/components/transactions/transactions-view"

interface MyListingsAndTransactionsWidgetProps {
  listings: Listing[]
  transactions: Transaction[]
  tenantSlug: string
  tenantId: string
  userId: string
  categories: Array<{ id: string; name: string }>
  neighborhoods: Array<{ id: string; name: string }>
  locations: Location[]
}

export function MyListingsAndTransactionsWidget({
  listings,
  transactions,
  tenantSlug,
  tenantId,
  userId,
  categories,
  neighborhoods,
  locations,
}: MyListingsAndTransactionsWidgetProps) {
  const router = useRouter()
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [editListingId, setEditListingId] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [deleteListingId, setDeleteListingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [archiveListingId, setArchiveListingId] = useState<string | null>(null)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [historyListingId, setHistoryListingId] = useState<string | null>(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [topLevelTab, setTopLevelTab] = useState<"listings" | "transactions" | "archive">("listings")
  const [highlightTransactionId, setHighlightTransactionId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    const highlight = params.get('highlight')

    if (tab === 'transactions') {
      setTopLevelTab('transactions')
    }
    if (highlight) {
      setHighlightTransactionId(highlight)
      setTimeout(() => setHighlightTransactionId(null), 3000)
    }
  }, [])

  const activeListings = listings.filter(l => !l.archived_at)

  const activeTransactionsCount = transactions.filter(
    t => ['confirmed', 'picked_up', 'returned'].includes(t.status)
  ).length

  const counts = {
    total: activeListings.length,
    drafts: activeListings.filter((l) => l.status === "draft").length,
    published: activeListings.filter((l) => l.status === "published").length,
    paused: activeListings.filter((l) => !l.is_available && l.status === "published").length,
  }

  const archivedListingsCount = listings.filter(l => l.archived_at).length
  const completedTransactionsCount = transactions.filter(t => t.status === "completed").length
  const archiveCount = archivedListingsCount + completedTransactionsCount

  const handlePause = async (listingId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setLoadingStates((prev) => ({ ...prev, [listingId]: true }))

    const result = await pauseExchangeListing(listingId, tenantSlug, tenantId)

    setLoadingStates((prev) => ({ ...prev, [listingId]: false }))

    if (result.success) {
      router.refresh()
    }
  }

  const handlePublish = async (listingId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setLoadingStates((prev) => ({ ...prev, [listingId]: true }))

    const result = await publishDraftListing(listingId, tenantSlug, tenantId)

    setLoadingStates((prev) => ({ ...prev, [listingId]: false }))

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || "Failed to publish listing")
    }
  }

  const handleView = (listingId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedListingId(listingId)
    setIsDetailOpen(true)
  }

  const handleEdit = (listingId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditListingId(listingId)
    setIsEditOpen(true)
  }

  const handleDelete = async (listingId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteListingId(listingId)
    setShowDeleteDialog(true)
  }

  const handleArchive = (listingId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setArchiveListingId(listingId)
    setShowArchiveDialog(true)
  }

  const handleViewHistory = (listingId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setHistoryListingId(listingId)
    setIsHistoryModalOpen(true)
  }

  const confirmArchive = async () => {
    if (!archiveListingId) return

    setLoadingStates((prev) => ({ ...prev, [archiveListingId]: true }))

    const result = await archiveListing(archiveListingId, userId, tenantId, tenantSlug)

    setLoadingStates((prev) => ({ ...prev, [archiveListingId]: false }))

    if (result.success) {
      setShowArchiveDialog(false)
      setArchiveListingId(null)
      router.refresh()
    } else {
      alert(result.error || "Failed to archive listing")
    }
  }

  const confirmDelete = async () => {
    if (!deleteListingId) return

    setLoadingStates((prev) => ({ ...prev, [deleteListingId]: true }))

    const result = await deleteExchangeListing(deleteListingId, tenantSlug, tenantId)

    setLoadingStates((prev) => ({ ...prev, [deleteListingId]: false }))

    if (result.success) {
      setShowDeleteDialog(false)
      setDeleteListingId(null)
      router.refresh()
    } else {
      alert(result.error || "Failed to delete listing")
    }
  }

  function renderListingCard(listing: Listing) {
    const isLoading = loadingStates[listing.id]
    const isDraft = listing.status === "draft"
    const isPaused = !listing.is_available && listing.status === "published"

    return (
      <div
        key={listing.id}
        className="group flex gap-3 p-3 md:p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer overflow-hidden"
        onClick={(e) => handleView(listing.id, e)}
      >
        {/* Image - small on mobile, slightly larger on desktop */}
        {listing.hero_photo ? (
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            <Image src={listing.hero_photo || "/placeholder.svg"} alt={listing.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        ) : (
          <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
            <Package className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground/50" />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Title + Badges */}
          <div className="flex items-start gap-2">
            <h4 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors flex-1 min-w-0">
              {listing.title}
            </h4>
            {(isDraft || isPaused || listing.status === "cancelled") && (
              <div className="flex gap-1 flex-shrink-0">
                {isDraft && <Badge variant="secondary" className="text-[10px] px-1.5 h-4">Draft</Badge>}
                {isPaused && <Badge variant="outline" className="text-[10px] px-1.5 h-4">Paused</Badge>}
                {listing.status === "cancelled" && <Badge variant="destructive" className="text-[10px] px-1.5 h-4">Cancelled</Badge>}
              </div>
            )}
          </div>

          {/* Metadata - stacked on mobile, horizontal on tablet+ */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {listing.pricing_type === "free"
                ? "Free"
                : listing.pricing_type === "fixed_price"
                  ? `${listing.price}`
                  : "Negotiable"}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="line-clamp-1">{listing.category?.name || "Uncategorized"}</span>
            <span className="hidden sm:inline">•</span>
            <span>Qty: {listing.available_quantity}</span>
          </div>
        </div>

        {/* Action buttons - HIDDEN on mobile, visible on desktop hover */}
        <div className="hidden md:flex items-center gap-1 absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-card/95 backdrop-blur-sm px-2 py-1.5 rounded-lg border shadow-sm" onClick={(e) => e.preventDefault()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={(e) => handleEdit(listing.id, e)}
            disabled={isLoading}
            title="Edit"
          >
            <Pencil className="h-3 w-3" />
          </Button>

          {isDraft ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={(e) => handlePublish(listing.id, e)}
              disabled={isLoading}
              title="Publish"
            >
              <FileText className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={(e) => handlePause(listing.id, e)}
              disabled={isLoading}
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? (
                <Play className="h-3 w-3" />
              ) : (
                <Pause className="h-3 w-3" />
              )}
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => handleDelete(listing.id, e)}
            disabled={isLoading}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  function renderEmptyState(message: string) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <Image src="/rio/parrot.png" alt="Rio" fill className="object-contain" />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    )
  }

  if (listings.length === 0 && transactions.length === 0) {
    return (
      <div className="text-center py-12 border rounded-xl bg-card">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <Image src="/rio/parrot.png" alt="Rio" fill className="object-contain" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Listings Yet</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          You haven't created any listings yet. Start sharing items with your community!
        </p>
        <CreateExchangeListingButton
          tenantSlug={tenantSlug}
          tenantId={tenantId}
          categories={categories}
          neighborhoods={neighborhoods}
          variant="default"
        />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Mobile: Stack title/badge and buttons | Desktop: Single row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base md:text-lg font-semibold">My Listings & Transactions</h3>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
              {counts.total}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm" className="flex-1 md:flex-none">
              <Link href={`/t/${tenantSlug}/dashboard/exchange`}>View All</Link>
            </Button>
            <Button asChild size="sm" className="flex-1 md:flex-none">
              <Link href={`/t/${tenantSlug}/dashboard/exchange/create`}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Create Listing</span>
                <span className="sm:hidden">Create</span>
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={topLevelTab} onValueChange={(v) => setTopLevelTab(v as "listings" | "transactions" | "archive")} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6">
            <TabsTrigger value="listings" className="text-xs md:text-sm">
              <span className="hidden sm:inline">Listings ({counts.total})</span>
              <span className="sm:hidden">Lists ({counts.total})</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs md:text-sm">
              <span className="hidden sm:inline">Transactions ({activeTransactionsCount})</span>
              <span className="sm:hidden">Txns ({activeTransactionsCount})</span>
            </TabsTrigger>
            <TabsTrigger value="archive" className="text-xs md:text-sm">
              <span className="hidden sm:inline">Archive ({archiveCount})</span>
              <span className="sm:hidden">Arch ({archiveCount})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-0">
            <Tabs defaultValue="all" className="w-full">
              {/* Filter tabs - scrollable on mobile */}
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-4">
                <TabsList className="bg-transparent p-0 h-auto gap-2 inline-flex md:flex">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-3 md:px-4 py-1 h-auto border border-transparent data-[state=active]:border-primary/20 text-xs md:text-sm whitespace-nowrap">All</TabsTrigger>
                  <TabsTrigger value="published" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-3 md:px-4 py-1 h-auto border border-transparent data-[state=active]:border-primary/20 text-xs md:text-sm whitespace-nowrap">Published</TabsTrigger>
                  <TabsTrigger value="drafts" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-3 md:px-4 py-1 h-auto border border-transparent data-[state=active]:border-primary/20 text-xs md:text-sm whitespace-nowrap">Drafts</TabsTrigger>
                  <TabsTrigger value="paused" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-3 md:px-4 py-1 h-auto border border-transparent data-[state=active]:border-primary/20 text-xs md:text-sm whitespace-nowrap">Paused</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="space-y-4 mt-0">
                {activeListings.length > 0 ? (
                  <div className="grid gap-3">
                    {activeListings.map((listing) => renderListingCard(listing))}
                  </div>
                ) : (
                  renderEmptyState("No listings yet")
                )}
              </TabsContent>

              <TabsContent value="drafts" className="space-y-4 mt-0">
                {counts.drafts > 0 ? (
                  <div className="grid gap-3">
                    {activeListings
                      .filter((l) => l.status === "draft")
                      .map((listing) => renderListingCard(listing))}
                  </div>
                ) : (
                  renderEmptyState("No draft listings")
                )}
              </TabsContent>

              <TabsContent value="published" className="space-y-4 mt-0">
                {counts.published > 0 ? (
                  <div className="grid gap-3">
                    {activeListings
                      .filter((l) => l.status === "published")
                      .map((listing) => renderListingCard(listing))}
                  </div>
                ) : (
                  renderEmptyState("No published listings")
                )}
              </TabsContent>

              <TabsContent value="paused" className="space-y-4 mt-0">
                {counts.paused > 0 ? (
                  <div className="grid gap-3">
                    {activeListings
                      .filter((l) => !l.is_available && l.status === "published")
                      .map((listing) => renderListingCard(listing))}
                  </div>
                ) : (
                  renderEmptyState("No paused listings")
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="transactions" className="mt-0">
            <TransactionsView
              transactions={transactions}
              userId={userId}
              tenantSlug={tenantSlug}
              tenantId={tenantId}
              highlightTransactionId={highlightTransactionId}
            />
          </TabsContent>

          <TabsContent value="archive" className="mt-0">
            <ArchiveView
              userId={userId}
              tenantId={tenantId}
              tenantSlug={tenantSlug}
            />
          </TabsContent>
        </Tabs>
      </div>

      {selectedListingId && (
        <ExchangeListingDetailModal
          listingId={selectedListingId}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          userId={userId}
          categories={categories}
          neighborhoods={neighborhoods}
          locations={locations}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}

      {editListingId && (
        <EditExchangeListingModal
          listingId={editListingId}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          categories={categories}
          neighborhoods={neighborhoods}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSuccess={() => {
            setIsEditOpen(false)
            router.refresh()
          }}
        />
      )}

      {historyListingId && (
        <ListingHistoryModal
          listingId={historyListingId}
          listingName={listings.find(l => l.id === historyListingId)?.title || "Listing"}
          open={isHistoryModalOpen}
          onOpenChange={setIsHistoryModalOpen}
          userId={userId}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
        />
      )}

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move your listing to the Archive tab. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>
              Archive Listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RioConfirmationModal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Listing?"
        description="This will permanently delete your listing. This action cannot be undone."
        image="/rio/rio_delete_warning.png"
        confirmText="Delete Listing"
        onConfirm={confirmDelete}
        isDestructive={true}
        isLoading={loadingStates[deleteListingId || ""]}
      />
    </>
  )
}
