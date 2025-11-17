"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, RotateCcw, HistoryIcon } from 'lucide-react'
import { format } from "date-fns"
import Image from "next/image"
import { unarchiveListing } from "@/app/actions/exchange-history"
import { useRouter } from 'next/navigation'
import { ListingHistoryModal } from "./listing-history-modal"

interface ArchivedListing {
  id: string
  title: string
  hero_photo: string | null
  archived_at: string
  transaction_count: number
  exchange_categories: {
    id: string
    name: string
  } | null
}

interface ArchivedListingsTableProps {
  listings: ArchivedListing[]
  userId: string
  tenantId: string
  tenantSlug: string
  onListingRestored: () => void
}

export function ArchivedListingsTable({
  listings,
  userId,
  tenantId,
  tenantSlug,
  onListingRestored,
}: ArchivedListingsTableProps) {
  const router = useRouter()
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [historyListingId, setHistoryListingId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const handleRestore = async (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    setRestoringId(listingId)
    const result = await unarchiveListing(listingId, userId, tenantId, tenantSlug)
    setRestoringId(null)

    if (result.success) {
      if (result.warning) {
        alert(result.warning)
      }
      onListingRestored()
      router.refresh()
    } else {
      alert(result.error || "Failed to restore listing")
    }
  }

  const handleViewHistory = (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setHistoryListingId(listingId)
    setHistoryOpen(true)
  }

  const selectedListing = listings.find(l => l.id === historyListingId)

  return (
    <>
      <div className="space-y-3">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="flex gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            {listing.hero_photo ? (
              <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                <Image 
                  src={listing.hero_photo || "/placeholder.svg"} 
                  alt={listing.title} 
                  fill 
                  className="object-cover" 
                />
              </div>
            ) : (
              <div className="w-16 h-16 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
                <HistoryIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm leading-tight truncate">{listing.title}</h4>
              
              <div className="flex items-center gap-2 mt-1">
                {listing.exchange_categories && (
                  <p className="text-xs text-muted-foreground">{listing.exchange_categories.name}</p>
                )}
                <span className="text-xs text-muted-foreground">•</span>
                <p className="text-xs text-muted-foreground">
                  Archived {format(new Date(listing.archived_at), "MMM d, yyyy")}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {listing.transaction_count} transaction{listing.transaction_count !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={(e) => handleViewHistory(listing.id, e)}
              >
                <HistoryIcon className="h-3 w-3 mr-1" />
                View History
              </Button>
              
              <Button
                size="sm"
                variant="default"
                className="h-8 text-xs"
                onClick={(e) => handleRestore(listing.id, e)}
                disabled={restoringId === listing.id}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Restore
              </Button>
            </div>
          </div>
        ))}
      </div>

      {historyListingId && selectedListing && (
        <ListingHistoryModal
          listingId={historyListingId}
          listingName={selectedListing.title}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          userId={userId}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
        />
      )}
    </>
  )
}
