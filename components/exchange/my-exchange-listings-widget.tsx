"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Plus, Pencil, Pause, Play, Eye, FileText, Trash2 } from 'lucide-react'
import Link from "next/link"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import { pauseExchangeListing, publishDraftListing, deleteExchangeListing } from "@/app/actions/exchange-listings"
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
import Image from "next/image"
import type { Location } from "@/types/locations"

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
}

interface MyExchangeListingsWidgetProps {
  listings: Listing[]
  tenantSlug: string
  tenantId: string
  userId: string
  categories: Array<{ id: string; name: string }>
  neighborhoods: Array<{ id: string; name: string }>
  locations: Location[]
}

export function MyExchangeListingsWidget({
  listings,
  tenantSlug,
  tenantId,
  userId,
  categories,
  neighborhoods,
  locations,
}: MyExchangeListingsWidgetProps) {
  const router = useRouter()
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [editListingId, setEditListingId] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [deleteListingId, setDeleteListingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const counts = {
    total: listings.length,
    drafts: listings.filter((l) => l.status === "draft").length,
    published: listings.filter((l) => l.status === "published").length,
    paused: listings.filter((l) => !l.is_available && l.status === "published").length,
  }

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
        className="flex gap-4 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
        onClick={(e) => handleView(listing.id, e)}
      >
        {listing.hero_photo ? (
          <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
            <Image src={listing.hero_photo || "/placeholder.svg"} alt={listing.title} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-20 h-20 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-base leading-tight truncate">{listing.title}</h4>
            <div className="flex gap-1 flex-shrink-0">
              {isDraft && <Badge variant="secondary">Draft</Badge>}
              {isPaused && <Badge variant="outline">Paused</Badge>}
              {listing.status === "cancelled" && <Badge variant="destructive">Cancelled</Badge>}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            {listing.pricing_type === "free"
              ? "Free"
              : listing.pricing_type === "fixed_price"
                ? `$${listing.price}`
                : "Negotiable"}
          </p>

          <div className="flex items-center gap-2 mt-1">
            {listing.category && <p className="text-xs text-muted-foreground">{listing.category.name}</p>}
            <p className="text-xs text-muted-foreground">Qty: {listing.available_quantity}</p>
          </div>

          <div className="flex items-center gap-1 mt-3" onClick={(e) => e.preventDefault()}>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={(e) => handleEdit(listing.id, e)}
              disabled={isLoading}
            >
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>

            {isDraft ? (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={(e) => handlePublish(listing.id, e)}
                disabled={isLoading}
              >
                <FileText className="h-3 w-3 mr-1" />
                Publish
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={(e) => handlePause(listing.id, e)}
                disabled={isLoading}
              >
                {isPaused ? (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </>
                )}
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={(e) => handleView(listing.id, e)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={(e) => handleDelete(listing.id, e)}
              disabled={isLoading}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    )
  }

  function renderEmptyState(message: string) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Listings</CardTitle>
          <CardDescription>Manage your exchange listings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              You haven't created any listings yet. Start sharing items with your community!
            </p>
            <CreateExchangeListingButton
              tenantSlug={tenantSlug}
              tenantId={tenantId}
              categories={categories}
              neighborhoods={neighborhoods}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>My Listings</CardTitle>
            <CardDescription>{counts.total} total listings</CardDescription>
          </div>
          <CreateExchangeListingButton
            tenantSlug={tenantSlug}
            tenantId={tenantId}
            categories={categories}
            neighborhoods={neighborhoods}
            variant="default"
          />
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({counts.total})</TabsTrigger>
              <TabsTrigger value="drafts">Drafts ({counts.drafts})</TabsTrigger>
              <TabsTrigger value="published">Published ({counts.published})</TabsTrigger>
              <TabsTrigger value="paused">Paused ({counts.paused})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {listings.length > 0 ? (
                <div className="space-y-3">
                  {listings.map((listing) => renderListingCard(listing))}
                </div>
              ) : (
                renderEmptyState("No listings yet")
              )}
            </TabsContent>

            <TabsContent value="drafts" className="space-y-4 mt-4">
              {counts.drafts > 0 ? (
                <div className="space-y-3">
                  {listings
                    .filter((l) => l.status === "draft")
                    .map((listing) => renderListingCard(listing))}
                </div>
              ) : (
                renderEmptyState("No draft listings")
              )}
            </TabsContent>

            <TabsContent value="published" className="space-y-4 mt-4">
              {counts.published > 0 ? (
                <div className="space-y-3">
                  {listings
                    .filter((l) => l.status === "published")
                    .map((listing) => renderListingCard(listing))}
                </div>
              ) : (
                renderEmptyState("No published listings")
              )}
            </TabsContent>

            <TabsContent value="paused" className="space-y-4 mt-4">
              {counts.paused > 0 ? (
                <div className="space-y-3">
                  {listings
                    .filter((l) => !l.is_available && l.status === "published")
                    .map((listing) => renderListingCard(listing))}
                </div>
              ) : (
                renderEmptyState("No paused listings")
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your listing. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
