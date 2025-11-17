"use client"

import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, ChevronDown, ExternalLink } from 'lucide-react'
import { ExchangeListingCard } from "@/components/exchange/exchange-listing-card"
import { ExchangeListingDetailModal } from "@/components/exchange/exchange-listing-detail-modal"
import Link from "next/link"

interface LocationExchangeSectionProps {
  listings: any[]
  slug: string
  userId: string
  tenantId: string
  locationName: string
  locationId: string
  canCreateListings: boolean
  categories: any[]
  neighborhoods: any[]
  locations: any[]
}

export function LocationExchangeSection({
  listings,
  slug,
  userId,
  tenantId,
  locationName,
  locationId,
  canCreateListings,
  categories,
  neighborhoods,
  locations,
}: LocationExchangeSectionProps) {
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(listings.length > 0)

  if (listings.length === 0) {
    return null
  }

  // Grid display of listings
  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Package className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">
                      Exchange Listings ({listings.length})
                    </CardTitle>
                    <CardDescription className="mt-1">Items available at {locationName}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={`/t/${slug}/dashboard/exchange`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Browse All
                    </Link>
                  </Button>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
