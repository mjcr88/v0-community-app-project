"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from 'lucide-react'
import { ExchangeListingCard } from "@/components/exchange/exchange-listing-card"
import { ExchangeListingDetailModal } from "@/components/exchange/exchange-listing-detail-modal"

interface ResidentExchangeListingsProps {
  listings: any[]
  residentName: string
  residentId: string
  slug: string
  userId: string
  tenantId: string
  categories: any[]
  neighborhoods: any[]
  locations: any[]
}

export function ResidentExchangeListings({
  listings,
  residentName,
  residentId,
  slug,
  userId,
  tenantId,
  categories,
  neighborhoods,
  locations,
}: ResidentExchangeListingsProps) {
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  
  if (listings.length === 0) {
    return null // Don't show section if no listings
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Exchange Listings
          </CardTitle>
          <CardDescription>
            {listings.length} item{listings.length === 1 ? "" : "s"} shared by {residentName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ExchangeListingCard
                key={listing.id}
                listing={listing}
                onClick={() => {
                  setSelectedListingId(listing.id)
                  setIsDetailOpen(true)
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {selectedListingId && (
        <ExchangeListingDetailModal
          listingId={selectedListingId}
          tenantId={tenantId}
          tenantSlug={slug}
          userId={userId}
          categories={categories}
          neighborhoods={neighborhoods}
          locations={locations}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}
    </>
  )
}
