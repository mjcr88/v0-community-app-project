"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ExchangeCategoryBadge } from "./exchange-category-badge"
import { ExchangeStatusBadge } from "./exchange-status-badge"
import { ExchangePriceBadge } from "./exchange-price-badge"
import { cn } from "@/lib/utils"

interface ExchangeListingCardProps {
  listing: {
    id: string
    title: string
    description?: string | null
    status: string
    is_available?: boolean
    pricing_type: string
    price_amount?: number | null
    available_quantity?: number | null
    category?: {
      id: string
      name: string
    } | null
    creator?: {
      id: string
      first_name: string
      last_name: string
      profile_picture_url?: string | null
    } | null
  }
  onClick?: () => void
  className?: string
}

export function ExchangeListingCard({ listing, onClick, className }: ExchangeListingCardProps) {
  const creatorName = listing.creator
    ? `${listing.creator.first_name} ${listing.creator.last_name}`
    : "Unknown"
  const creatorInitials = listing.creator
    ? `${listing.creator.first_name[0]}${listing.creator.last_name[0]}`
    : "?"
  const avatarUrl = listing.creator?.profile_picture_url

  return (
    <Card className={cn("hover:bg-accent transition-colors cursor-pointer", className)} onClick={onClick}>
      <CardHeader className="space-y-3">
        {/* Header: Creator and status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>{creatorInitials}</AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground truncate">{creatorName}</p>
          </div>
          <ExchangeStatusBadge 
            status={listing.status as any} 
            isAvailable={listing.is_available ?? true}
            className="flex-shrink-0" 
          />
        </div>

        {/* Title */}
        <CardTitle className="text-lg leading-tight line-clamp-2 text-balance">{listing.title}</CardTitle>

        {/* Category and price badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {listing.category && <ExchangeCategoryBadge category={listing.category.name} />}
          <ExchangePriceBadge pricingType={listing.pricing_type} priceAmount={listing.price_amount} />
        </div>
      </CardHeader>

      {listing.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">{listing.description}</p>
        </CardContent>
      )}
    </Card>
  )
}
