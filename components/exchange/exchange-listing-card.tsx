"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ExchangeCategoryBadge } from "./exchange-category-badge"
import { ExchangeStatusBadge } from "./exchange-status-badge"
import { ExchangePriceBadge } from "./exchange-price-badge"
import { cn } from "@/lib/utils"
import { MapPin } from 'lucide-react'

interface ExchangeListingCardProps {
  listing: {
    id: string
    title: string
    description?: string | null
    status: string
    is_available?: boolean
    pricing_type: string
    price_amount?: number | null
    condition?: string | null
    available_quantity?: number | null
    hero_photo?: string | null
    photos?: string[] | null
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
    custom_location_name?: string | null
    location?: {
      name: string
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

  const conditionDisplay = listing.condition 
    ? listing.condition.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : null

  const shouldShowQuantity = 
    listing.available_quantity !== null && 
    listing.available_quantity !== undefined &&
    listing.category &&
    (listing.category.name === "Tools & Equipment" || listing.category.name === "Food & Produce")

  const locationDisplay = listing.custom_location_name || listing.location?.name

  return (
    <Card className={cn("hover:bg-accent transition-colors cursor-pointer", className)} onClick={onClick}>
      {listing.hero_photo && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img 
            src={listing.hero_photo || "/placeholder.svg"} 
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
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
          {listing.status === "draft" ? (
            <Badge variant="outline" className="flex-shrink-0">
              Draft
            </Badge>
          ) : (
            <ExchangeStatusBadge 
              status={listing.status as any} 
              isAvailable={listing.is_available ?? true}
              className="flex-shrink-0" 
            />
          )}
        </div>

        {/* Title */}
        <CardTitle className="text-lg leading-tight line-clamp-2 text-balance">{listing.title}</CardTitle>

        {/* Category, price, and location badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {listing.category && <ExchangeCategoryBadge categoryName={listing.category.name} />}
          <ExchangePriceBadge pricingType={listing.pricing_type} price={listing.price_amount} />
          {conditionDisplay && (
            <Badge variant="secondary" className="text-xs">
              {conditionDisplay}
            </Badge>
          )}
          {shouldShowQuantity && (
            <Badge variant="outline" className="text-xs">
              {listing.available_quantity} available
            </Badge>
          )}
          {locationDisplay && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {locationDisplay}
            </Badge>
          )}
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
