"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ExchangeCategoryBadge } from "./exchange-category-badge"
import { ExchangeStatusBadge } from "./exchange-status-badge"
import { ExchangePriceBadge } from "./exchange-price-badge"
import { MapPin, Calendar, Package } from 'lucide-react'
import { getExchangeListingById } from "@/app/actions/exchange-listings"
import { GoogleMapViewer } from "@/components/map/google-map-viewer"
import { toast } from "sonner"

interface ExchangeListingDetailModalProps {
  listingId: string
  tenantId: string
  tenantSlug: string
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExchangeListingDetailModal({
  listingId,
  tenantId,
  tenantSlug,
  userId,
  open,
  onOpenChange,
}: ExchangeListingDetailModalProps) {
  const [listing, setListing] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    if (open && listingId) {
      loadListing()
    }
  }, [open, listingId])

  async function loadListing() {
    setIsLoading(true)
    const result = await getExchangeListingById(listingId, tenantId)

    if (result.success && result.data) {
      setListing(result.data)
      // Set selected photo to hero or first photo
      setSelectedPhoto(result.data.hero_photo || result.data.photos?.[0] || null)
    } else {
      toast.error(result.error || "Failed to load listing")
      onOpenChange(false)
    }

    setIsLoading(false)
  }

  if (isLoading || !listing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const isCreator = userId === listing.created_by
  const creatorName =
    `${listing.creator?.first_name || ""} ${listing.creator?.last_name || ""}`.trim() || "Unknown User"
  const creatorInitials =
    `${listing.creator?.first_name?.[0] || ""}${listing.creator?.last_name?.[0] || ""}`.toUpperCase() || "?"

  const conditionDisplay = listing.condition
    ? listing.condition.split("_").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    : null

  const shouldShowQuantity =
    listing.available_quantity !== null &&
    listing.available_quantity !== undefined &&
    listing.category &&
    (listing.category.name === "Tools & Equipment" || listing.category.name === "Food & Produce")

  // Location logic
  const hasMapLocation =
    (listing.location?.coordinates?.lat && listing.location?.coordinates?.lng) ||
    (listing.custom_location_lat && listing.custom_location_lng)

  const locationCoordinates = listing.location?.coordinates 
    ? (typeof listing.location.coordinates === 'string' 
        ? JSON.parse(listing.location.coordinates) 
        : listing.location.coordinates)
    : (listing.custom_location_lat && listing.custom_location_lng 
        ? { lat: listing.custom_location_lat, lng: listing.custom_location_lng }
        : null)

  const locationName = listing.custom_location_name || listing.location?.name

  const neighborhoods = listing.neighborhoods?.map((n: any) => n.neighborhood?.name).filter(Boolean) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {listing.category && <ExchangeCategoryBadge categoryName={listing.category.name} />}
                <ExchangeStatusBadge status={listing.status} isAvailable={listing.is_available ?? true} />
                {conditionDisplay && (
                  <Badge variant="secondary" className="text-xs">
                    {conditionDisplay}
                  </Badge>
                )}
                {listing.visibility_scope === "neighborhood" && (
                  <Badge variant="outline" className="text-xs">
                    Neighborhood Only
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl text-balance">{listing.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Gallery */}
          {(selectedPhoto || listing.photos?.length > 0) && (
            <div className="space-y-3">
              {/* Main Photo */}
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={selectedPhoto || "/placeholder.svg?height=400&width=600"}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnail Strip */}
              {listing.photos && listing.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {listing.photos.map((photo: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhoto(photo)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                        selectedPhoto === photo ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img src={photo || "/placeholder.svg"} alt={`${listing.title} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pricing Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <div className="flex items-center gap-2">
                    <ExchangePriceBadge pricingType={listing.pricing_type} price={listing.price} className="text-lg" />
                  </div>
                </div>
                {shouldShowQuantity && (
                  <div className="space-y-1 text-right">
                    <p className="text-sm text-muted-foreground">Available Quantity</p>
                    <div className="flex items-center gap-1 text-lg font-semibold justify-end">
                      <Package className="h-5 w-5" />
                      <span>{listing.available_quantity}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {listing.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Location Section */}
          {(locationName || hasMapLocation) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Location</h3>
              {locationName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{locationName}</span>
                </div>
              )}
              {hasMapLocation && locationCoordinates && (
                <div className="h-[250px] rounded-lg overflow-hidden border">
                  <GoogleMapViewer
                    locations={[
                      {
                        id: "listing-location",
                        name: locationName || "Pickup Location",
                        type: "facility",
                        coordinates: locationCoordinates,
                      },
                    ]}
                    mapCenter={locationCoordinates}
                    mapZoom={15}
                    minimal={true}
                    showInfoCard={false}
                  />
                </div>
              )}
            </div>
          )}

          {/* Creator Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Shared by</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={listing.creator?.profile_picture_url || undefined} alt={`${creatorName}'s avatar`} />
                    <AvatarFallback>{creatorInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{creatorName}</p>
                    <p className="text-sm text-muted-foreground">Community Member</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request to Borrow Button - Placeholder for Sprint 6 */}
          {!isCreator && listing.is_available && listing.status === "published" && (
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => toast.info("Request functionality coming soon in Sprint 6!")}
            >
              Request to Borrow
            </Button>
          )}

          {/* Additional Details */}
          <div className="space-y-3 text-sm">
            <h3 className="font-semibold text-lg">Additional Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium">{listing.category?.name || "N/A"}</p>
              </div>
              {conditionDisplay && (
                <div>
                  <p className="text-muted-foreground">Condition</p>
                  <p className="font-medium">{conditionDisplay}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Date Posted</p>
                <div className="flex items-center gap-1 font-medium">
                  <Calendar className="h-4 w-4" />
                  {new Date(listing.published_at || listing.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
              {listing.visibility_scope === "neighborhood" && neighborhoods.length > 0 && (
                <div>
                  <p className="text-muted-foreground">Visible To</p>
                  <p className="font-medium">{neighborhoods.join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
