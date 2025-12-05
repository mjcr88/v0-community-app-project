"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, MessageSquare } from "lucide-react"

interface ExchangeListingCardProps {
    listing: {
        id: string
        title: string
        description?: string
        category: { name: string }
        price: number
        quantity_available: number
        is_free: boolean
        created_at: string
        location?: { name: string }
    }
    ownerName: string
    ownerAvatar?: string
    onClick?: () => void
}

export function ExchangeListingCard({
    listing,
    ownerName,
    ownerAvatar,
    onClick,
}: ExchangeListingCardProps) {
    // Check if listing is new (created within last 7 days)
    const isNew = new Date().getTime() - new Date(listing.created_at).getTime() < 7 * 24 * 60 * 60 * 1000

    // Get initials for avatar fallback
    const initials = ownerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={onClick}
        >
            <CardContent className="p-4 space-y-3">
                {/* Header: Avatar + Name + Badges */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={ownerAvatar} alt={ownerName} />
                            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{ownerName}</p>
                        </div>
                    </div>

                    <div className="flex gap-1.5 flex-shrink-0">
                        <Badge variant="default" className="bg-[#6B9B47] hover:bg-[#6B9B47]/90 text-white">
                            <span className="text-xs">✓</span>
                            <span className="ml-1">Available</span>
                        </Badge>
                    </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg leading-tight">{listing.title}</h3>

                {/* Badges Row */}
                <div className="flex flex-wrap gap-2">
                    {/* Category */}
                    <Badge variant="secondary" className="bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100">
                        {listing.category.name}
                    </Badge>

                    {/* Price/Free */}
                    {listing.is_free ? (
                        <Badge variant="default" className="bg-[#6B9B47] hover:bg-[#6B9B47]/90 text-white">
                            Free
                        </Badge>
                    ) : (
                        <Badge variant="outline">${(listing.price || 0).toFixed(2)}</Badge>
                    )}

                    {/* New */}
                    {isNew && (
                        <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">
                            New
                        </Badge>
                    )}

                    {/* Quantity */}
                    <Badge variant="outline" className="text-muted-foreground">
                        {listing.quantity_available} available
                    </Badge>

                    {/* Location */}
                    {listing.location && (
                        <Badge variant="outline" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {listing.location.name}
                        </Badge>
                    )}
                </div>

                {/* Description Preview */}
                {listing.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {listing.description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
