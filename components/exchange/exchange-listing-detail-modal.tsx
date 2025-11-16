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
import { MapPin, Calendar, Package, Pencil, Trash2, Pause, Play } from 'lucide-react'
import { getExchangeListingById, pauseExchangeListing, deleteExchangeListing } from "@/app/actions/exchange-listings"
import { GoogleMapViewer } from "@/components/map/google-map-viewer"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
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
import { EditExchangeListingModal } from "./edit-exchange-listing-modal"

interface ExchangeListingDetailModalProps {
  listingId: string
  tenantId: string
  tenantSlug: string
  userId: string | null
  locations: any[]
  categories?: Array<{ id: string; name: string }>
  neighborhoods?: Array<{ id: string; name: string }>
  open: boolean
  onOpenChange: (open: boolean) => void
}

function parseLocationCoordinates(coords: any): { lat: number; lng: number } | any[] | null {
  if (!coords) return null
  
  // Handle string JSON
  if (typeof coords === 'string') {
    try {
      coords = JSON.parse(coords)
    } catch (e) {
      console.error("[v0] Failed to parse coords string:", e)
      return null
    }
  }
  
  // Handle object - try multiple formats
  if (typeof coords === 'object') {
    // Format 1: {lat, lng}
    if (typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      return { lat: coords.lat, lng: coords.lng }
    }
    
    // Format 2: {latitude, longitude}
    if (typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      return { lat: coords.latitude, lng: coords.longitude }
    }
    
    // Format 3: {x, y} (PostGIS format)
    if (typeof coords.x === 'number' && typeof coords.y === 'number') {
      return { lat: coords.x, lng: coords.y }
    }
    
    // Format 4: [lat, lng] single point array
    if (Array.isArray(coords) && coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return { lat: Number(coords[0]), lng: Number(coords[1]) }
    }
    
    // Format 5: [[lat, lng], [lat, lng], ...] path/boundary array (return as-is for caller to handle)
    if (Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0])) {
      console.log("[v0] Detected path/boundary array format, returning as-is")
      return coords
    }
  }
  
  console.warn("[v0] Unknown coordinate format:", coords)
  return null
}

export function ExchangeListingDetailModal({
  listingId,
  tenantId,
  tenantSlug,
  userId,
  locations,
  categories = [],
  neighborhoods = [],
  open,
  onOpenChange,
}: ExchangeListingDetailModalProps) {
  const [listing, setListing] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

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
      setSelectedPhoto(result.data.hero_photo || result.data.photos?.[0] || null)
      
      console.log("[v0] LOCATION DEBUG:", {
        hasLocationObject: !!result.data.location,
        locationId: result.data.location?.id,
        locationName: result.data.location?.name,
        locationType: result.data.location?.type,
        coordinatesRaw: result.data.location?.coordinates,
        coordinatesType: typeof result.data.location?.coordinates,
        pathCoordinatesRaw: result.data.location?.path_coordinates,
        pathCoordinatesType: typeof result.data.location?.path_coordinates,
        boundaryCoordinatesRaw: result.data.location?.boundary_coordinates,
        boundaryCoordinatesType: typeof result.data.location?.boundary_coordinates,
        customLat: result.data.custom_location_lat,
        customLatType: typeof result.data.custom_location_lat,
        customLng: result.data.custom_location_lng,
        customLngType: typeof result.data.custom_location_lng,
        customLocationName: result.data.custom_location_name,
      })
    } else {
      toast.error(result.error || "Failed to load listing")
      onOpenChange(false)
    }

    setIsLoading(false)
  }

  async function handleTogglePause() {
    setIsPausing(true)
    const result = await pauseExchangeListing(listingId, tenantSlug, tenantId)

    if (result.success) {
      toast.success(result.data?.is_available ? "Listing resumed" : "Listing paused")
      await loadListing()
    } else {
      toast.error(result.error || "Failed to update listing")
    }
    setIsPausing(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteExchangeListing(listingId, tenantSlug, tenantId)

    if (result.success) {
      toast.success("Listing deleted")
      onOpenChange(false)
      router.push(`/t/${tenantSlug}/dashboard/exchange`)
    } else {
      toast.error(result.error || "Failed to delete listing")
      setShowDeleteDialog(false)
    }
    setIsDeleting(false)
  }

  function handleEditSuccess() {
    loadListing()
  }

  if (isLoading || !listing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">Loading listing...</p>
            </div>
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

  let listingLocationForMap = null
  let locationName = null
  
  if (listing.location_id && listing.location) {
    locationName = listing.location.name
    let coords: { lat: number; lng: number } | null = null

    if (listing.location.coordinates) {
      const parsed = parseLocationCoordinates(listing.location.coordinates)
      if (parsed && !Array.isArray(parsed)) {
        coords = parsed
        console.log("[v0] Using coordinates:", coords)
      }
    }

    if (!coords && listing.location.path_coordinates) {
      const pathData = listing.location.path_coordinates
      console.log("[v0] Raw path_coordinates:", pathData)
      
      if (Array.isArray(pathData) && pathData.length > 0) {
        const firstPoint = pathData[0]
        if (Array.isArray(firstPoint) && firstPoint.length === 2) {
          coords = { lat: Number(firstPoint[0]), lng: Number(firstPoint[1]) }
          console.log("[v0] Using path_coordinates first point:", coords)
        }
      }
    }

    if (!coords && listing.location.boundary_coordinates) {
      const boundaryData = listing.location.boundary_coordinates
      console.log("[v0] Raw boundary_coordinates:", boundaryData)
      
      if (Array.isArray(boundaryData) && boundaryData.length > 0) {
        const lats = boundaryData.map((point: any) => (Array.isArray(point) ? Number(point[0]) : 0))
        const lngs = boundaryData.map((point: any) => (Array.isArray(point) ? Number(point[1]) : 0))
        const centerLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length
        const centerLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length
        coords = { lat: centerLat, lng: centerLng }
        console.log("[v0] Using boundary_coordinates center:", coords)
      }
    }

    if (coords) {
      listingLocationForMap = {
        id: listing.location.id,
        name: listing.location.name,
        type: (listing.location.type || "facility") as const,
        coordinates: coords
      }
      console.log("[v0] Community location resolved:", listingLocationForMap)
    }
  }
  
  if (!locationName && listing.custom_location_name) {
    locationName = listing.custom_location_name
  }
  
  if (!listingLocationForMap && listing.custom_location_lat && listing.custom_location_lng) {
    listingLocationForMap = {
      id: "custom-location",
      name: listing.custom_location_name || "Pickup Location",
      type: "facility" as const,
      coordinates: {
        lat: Number(listing.custom_location_lat),
        lng: Number(listing.custom_location_lng)
      }
    }
    console.log("[v0] Custom location resolved:", listingLocationForMap)
  }

  const mapLocations = listingLocationForMap 
    ? [...locations, listingLocationForMap]
    : locations

  const hasMapLocation = listingLocationForMap !== null
  const visibleNeighborhoods = listing.neighborhoods?.map((n: any) => n.neighborhood?.name).filter(Boolean) || []
  const showBorrowButton = !isCreator && listing.is_available && listing.status === "published"

  return (
    <>
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
            {(selectedPhoto || listing.photos?.length > 0) && (
              <div className="space-y-3">
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                  <img
                    src={selectedPhoto || "/placeholder.svg?height=400&width=600"}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>

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

            {listing.description && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{listing.description}</p>
              </div>
            )}

            {locationName && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Location</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{locationName}</span>
                </div>
                {hasMapLocation && (
                  <div className="h-[250px] rounded-lg overflow-hidden border">
                    <GoogleMapViewer
                      locations={mapLocations}
                      mapCenter={listingLocationForMap!.coordinates}
                      mapZoom={15}
                      minimal={true}
                      showInfoCard={false}
                      highlightLocationId={listingLocationForMap!.id}
                    />
                  </div>
                )}
                {!hasMapLocation && (
                  <p className="text-sm text-muted-foreground italic">
                    Map not available for this location
                  </p>
                )}
              </div>
            )}

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

            {isCreator && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">Manage Listing</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Listing
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleTogglePause}
                        disabled={isPausing}
                      >
                        {listing.is_available ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause Listing
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Resume Listing
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Listing
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {showBorrowButton && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => toast.info("Request functionality coming soon in Sprint 7!")}
              >
                Request to Borrow
              </Button>
            )}

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
                {listing.visibility_scope === "neighborhood" && visibleNeighborhoods.length > 0 && (
                  <div>
                    <p className="text-muted-foreground">Visible To</p>
                    <p className="font-medium">{visibleNeighborhoods.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isCreator && (
        <EditExchangeListingModal
          listingId={listingId}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          tenantSlug={tenantSlug}
          tenantId={tenantId}
          categories={categories}
          neighborhoods={neighborhoods}
          onSuccess={handleEditSuccess}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your listing and remove it from the community exchange.
              {listing?.status === "published" && " Make sure there are no active transactions before deleting."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
