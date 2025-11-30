"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ExchangeCategoryBadge } from "./exchange-category-badge"
import { ExchangeStatusBadge } from "./exchange-status-badge"
import { ExchangePriceBadge } from "./exchange-price-badge"
import { cn } from "@/lib/utils"
import { MapPin, Flag } from 'lucide-react'

import type { ExchangePricingType } from "@/types/exchange"

interface ExchangeListingCardProps {
  listing: {
    id: string
    title: string
    description?: string | null
    status: string
    is_available?: boolean
    pricing_type: ExchangePricingType
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
    flag_count?: number
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
    <Card
      className={cn(
        "group overflow-hidden cursor-pointer",
        "bg-card border-border shadow-sm",
        "transition-all duration-300 ease-out",
        "hover:shadow-lg hover:-translate-y-1",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      {/* Always show image area for uniform card appearance */}
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
        {listing.hero_photo ? (
          <>
            {/* Overlay gradient for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />

            <img
              src={listing.hero_photo}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </>
        ) : (
          /* Rio placeholder for listings without images */
          <div className="w-full h-full flex items-center justify-center">
            <svg
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-32 h-32 opacity-40"
            >
              {/* Simple macaw silhouette - friendly pose */}
              <circle cx="100" cy="80" r="32" fill="hsl(var(--forest-growth))" opacity="0.2" />
              <ellipse cx="100" cy="125" rx="38" ry="48" fill="hsl(var(--forest-growth))" opacity="0.3" />

              {/* Wings */}
              <path
                d="M 65 110 Q 45 115 40 125"
                stroke="hsl(var(--sunrise))"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.4"
              />
              <path
                d="M 135 110 Q 155 115 160 125"
                stroke="hsl(var(--sunrise))"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.4"
              />

              {/* Face */}
              <circle cx="88" cy="75" r="4" fill="hsl(var(--sky))" />
              <circle cx="112" cy="75" r="4" fill="hsl(var(--sky))" />
              <path d="M 93 88 Q 100 92 107 88" stroke="hsl(var(--sunrise))" strokeWidth="3" fill="none" />

              {/* Beak */}
              <path d="M 100 80 L 100 88" stroke="hsl(var(--sunrise))" strokeWidth="2" />
            </svg>
          </div>
        )}
      </div>

      <CardHeader className="space-y-2 p-3">
        {/* Header: Creator and status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="h-8 w-8 flex-shrink-0 ring-1 ring-border">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{creatorInitials}</AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground truncate font-medium">{creatorName}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {listing.flag_count !== undefined && listing.flag_count > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 h-5 gap-1">
                <Flag className="h-2.5 w-2.5" />
                {listing.flag_count}
              </Badge>
            )}
            {listing.status === "draft" ? (
              <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                Draft
              </Badge>
            ) : (
              <ExchangeStatusBadge
                status={listing.status as any}
                isAvailable={listing.is_available ?? true}
                className="text-[10px] px-1.5 h-5"
              />
            )}
          </div>
        </div>

        {/* Title */}
        <CardTitle className="text-base font-semibold leading-tight line-clamp-1 text-balance group-hover:text-primary transition-colors">
          {listing.title}
        </CardTitle>

        {/* Category, price, and other badges - wrapped properly */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {listing.category && <ExchangeCategoryBadge categoryName={listing.category.name} className="text-[10px] px-1.5 h-5" />}
          <ExchangePriceBadge pricingType={listing.pricing_type} price={listing.price_amount} className="text-[10px] px-1.5 h-5" />
          {conditionDisplay && (
            <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
              {conditionDisplay}
            </Badge>
          )}
          {shouldShowQuantity && (
            <Badge variant="outline" className="text-[10px] px-1.5 h-5">
              {listing.available_quantity} available
            </Badge>
          )}
          {locationDisplay && (
            <Badge variant="outline" className="text-[10px] px-1.5 h-5 flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              <span className="truncate max-w-[100px]">{locationDisplay}</span>
            </Badge>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}
