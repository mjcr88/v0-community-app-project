"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { getExchangeListingById, updateExchangeListing } from "@/app/actions/exchange-listings"
import { Loader2, AlertCircle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import type { ExchangePricingType, ExchangeCondition } from "@/types/exchange"
import { LocationSelector } from "@/components/event-forms/location-selector"
import { PhotoManager } from "@/components/photo-manager"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EditExchangeListingModalProps {
  listingId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantSlug: string
  tenantId: string
  categories: Array<{ id: string; name: string }>
  neighborhoods: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export function EditExchangeListingModal({
  listingId,
  open,
  onOpenChange,
  tenantSlug,
  tenantId,
  categories,
  neighborhoods,
  onSuccess,
}: EditExchangeListingModalProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasActiveTransactions, setHasActiveTransactions] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    pricing_type: "free" as ExchangePricingType,
    price: "",
    condition: "" as ExchangeCondition | "",
    available_quantity: "",
    visibility_scope: "community" as "community" | "neighborhood",
    neighborhood_ids: [] as string[],
    location_type: "none" as "none" | "community" | "custom",
    location_id: null as string | null,
    custom_location_name: "",
    custom_location_lat: null as number | null,
    custom_location_lng: null as number | null,
    photos: [] as string[],
    hero_photo: null as string | null,
  })

  useEffect(() => {
    if (open && listingId) {
      loadListing()
    }
  }, [open, listingId])

  async function loadListing() {
    setIsLoading(true)
    const result = await getExchangeListingById(listingId, tenantId)

    if (result.success && result.data) {
      const listing = result.data
      
      console.log("[v0] Loading listing data:", {
        categoryId: listing.category_id,
        categoryName: listing.category?.name,
        allCategories: categories.map(c => ({ id: c.id, name: c.name }))
      })
      
      // Check if listing has active transactions (would come from server action)
      setHasActiveTransactions(false) // TODO: Add this check in getExchangeListingById

      // Determine location type
      let locationType: "none" | "community" | "custom" = "none"
      if (listing.location_id) {
        locationType = "community"
      } else if (listing.custom_location_lat && listing.custom_location_lng) {
        locationType = "custom"
      }

      setFormData({
        title: listing.title,
        description: listing.description || "",
        category_id: listing.category_id,
        pricing_type: listing.pricing_type,
        price: listing.price ? listing.price.toString() : "",
        condition: listing.condition || "",
        available_quantity: listing.available_quantity ? listing.available_quantity.toString() : "",
        visibility_scope: listing.visibility_scope,
        neighborhood_ids: listing.neighborhoods?.map((n: any) => n.neighborhood_id) || [],
        location_type: locationType,
        location_id: listing.location_id,
        custom_location_name: listing.custom_location_name || "",
        custom_location_lat: listing.custom_location_lat,
        custom_location_lng: listing.custom_location_lng,
        photos: listing.photos || [],
        hero_photo: listing.hero_photo || null,
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to load listing",
        variant: "destructive",
      })
      onOpenChange(false)
    }

    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.title.trim()) {
        toast({
          title: "Title required",
          description: "Please enter a title for your listing",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (!formData.category_id) {
        toast({
          title: "Category required",
          description: "Please select a category for your listing",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (formData.pricing_type === "fixed_price") {
        const priceNum = parseFloat(formData.price)
        if (!formData.price || isNaN(priceNum) || priceNum <= 0) {
          toast({
            title: "Price required",
            description: "Please enter a valid price for your listing",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      if (formData.visibility_scope === "neighborhood" && formData.neighborhood_ids.length === 0) {
        toast({
          title: "Neighborhoods required",
          description: "Please select at least one neighborhood for neighborhood-only visibility",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      const listingData = {
        title: formData.title.trim(),
        description: formData.description.trim() || "",
        category_id: formData.category_id,
        pricing_type: formData.pricing_type,
        price: formData.pricing_type === "fixed_price" ? parseFloat(formData.price) : null,
        condition: formData.condition,
        available_quantity: formData.available_quantity ? parseInt(formData.available_quantity, 10) : null,
        visibility_scope: formData.visibility_scope,
        neighborhood_ids: formData.visibility_scope === "neighborhood" ? formData.neighborhood_ids : [],
        location_id: formData.location_type === "community" ? formData.location_id : null,
        custom_location_name: formData.location_type === "custom" ? formData.custom_location_name : null,
        custom_location_lat: formData.location_type === "custom" ? formData.custom_location_lat : null,
        custom_location_lng: formData.location_type === "custom" ? formData.custom_location_lng : null,
        photos: formData.photos,
        hero_photo: formData.hero_photo,
      }

      const result = await updateExchangeListing(listingId, tenantSlug, tenantId, listingData)

      if (result.success) {
        toast({
          title: "Listing updated!",
          description: "Your changes have been saved.",
        })
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update listing",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Listing update error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategory = categories.find(c => c.id === formData.category_id)
  const isToolsEquipment = selectedCategory?.name === "Tools & Equipment"
  const isFoodProduce = selectedCategory?.name === "Food & Produce"
  const showPricing = selectedCategory && !isToolsEquipment
  const showCondition = isToolsEquipment
  const showQuantity = isToolsEquipment || isFoodProduce

  const toggleNeighborhood = (neighborhoodId: string) => {
    setFormData(prev => ({
      ...prev,
      neighborhood_ids: prev.neighborhood_ids.includes(neighborhoodId)
        ? prev.neighborhood_ids.filter(id => id !== neighborhoodId)
        : [...prev.neighborhood_ids, neighborhoodId]
    }))
  }

  const handleLocationTypeChange = useCallback((type: "none" | "community" | "custom") => {
    setFormData(prev => ({
      ...prev,
      location_type: type,
      location_id: type === "community" ? prev.location_id : null,
      custom_location_name: type === "custom" ? prev.custom_location_name : "",
      custom_location_lat: type === "custom" ? prev.custom_location_lat : null,
      custom_location_lng: type === "custom" ? prev.custom_location_lng : null,
    }))
  }, [])

  const handleCommunityLocationChange = useCallback((locationId: string) => {
    setFormData(prev => ({ ...prev, location_id: locationId }))
  }, [])

  const handleCustomLocationNameChange = useCallback((name: string) => {
    setFormData(prev => ({
      ...prev,
      custom_location_name: name,
    }))
  }, [])

  const handleCustomLocationChange = useCallback((data: {
    coordinates?: { lat: number; lng: number } | null
    type?: "marker" | "polygon" | null
    path?: Array<{ lat: number; lng: number }> | null
  }) => {
    setFormData(prev => ({
      ...prev,
      custom_location_lat: data.coordinates?.lat || null,
      custom_location_lng: data.coordinates?.lng || null,
    }))
  }, [])

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Loading listing...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Exchange Listing</DialogTitle>
          <DialogDescription>Update your listing details</DialogDescription>
        </DialogHeader>

        {hasActiveTransactions && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This listing has active transactions. You can only update the quantity while transactions are in progress.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <PhotoManager
                  photos={formData.photos}
                  heroPhoto={formData.hero_photo}
                  onPhotosChange={(photos) => setFormData(prev => ({ ...prev, photos }))}
                  onHeroPhotoChange={(heroPhoto) => setFormData(prev => ({ ...prev, hero_photo: heroPhoto }))}
                  maxPhotos={10}
                  entityType="location"
                  disabled={hasActiveTransactions}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Listing Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Tall Ladder, Fresh Mangos, Graphic Design Services..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={hasActiveTransactions}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => {
                    console.log("[v0] Category changed to:", value)
                    setFormData({ ...formData, category_id: value })
                  }}
                  disabled={hasActiveTransactions}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell your community more about this item or service..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={hasActiveTransactions}
                  rows={4}
                />
              </div>

              {showPricing && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Pricing</Label>
                  </div>

                  <RadioGroup
                    value={formData.pricing_type}
                    onValueChange={(value) => setFormData({ ...formData, pricing_type: value as ExchangePricingType, price: "" })}
                    disabled={hasActiveTransactions}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 rounded-md border p-4">
                        <RadioGroupItem value="free" id="free" className="mt-1" disabled={hasActiveTransactions} />
                        <div className="flex-1">
                          <Label htmlFor="free" className="font-medium cursor-pointer">
                            Free
                          </Label>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 rounded-md border p-4">
                        <RadioGroupItem value="fixed_price" id="fixed_price" className="mt-1" disabled={hasActiveTransactions} />
                        <div className="flex-1">
                          <Label htmlFor="fixed_price" className="font-medium cursor-pointer">
                            Fixed Price
                          </Label>
                          {formData.pricing_type === "fixed_price" && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">$</span>
                                <Input
                                  id="price"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={formData.price}
                                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                  className="max-w-32"
                                  disabled={hasActiveTransactions}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 rounded-md border p-4">
                        <RadioGroupItem value="pay_what_you_want" id="pay_what_you_want" className="mt-1" disabled={hasActiveTransactions} />
                        <div className="flex-1">
                          <Label htmlFor="pay_what_you_want" className="font-medium cursor-pointer">
                            Pay What You Want
                          </Label>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {showCondition && (
                <div className="space-y-2">
                  <Label htmlFor="edit-condition">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value as ExchangeCondition })}
                    disabled={hasActiveTransactions}
                  >
                    <SelectTrigger id="edit-condition">
                      <SelectValue placeholder="Select condition (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="slightly_used">Slightly Used</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                      <SelectItem value="slightly_damaged">Slightly Damaged</SelectItem>
                      <SelectItem value="maintenance">Needs Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showQuantity && (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Available Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="How many are available?"
                    value={formData.available_quantity}
                    onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {hasActiveTransactions 
                      ? "You can update quantity even with active transactions"
                      : isFoodProduce 
                        ? "E.g., 10 mangos, 5 loaves of bread"
                        : "E.g., how many tools are available to lend"}
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="location">Location (Optional)</Label>
                <LocationSelector
                  tenantId={tenantId}
                  locationType={formData.location_type}
                  communityLocationId={formData.location_id}
                  customLocationName={formData.custom_location_name}
                  customLocationCoordinates={
                    formData.custom_location_lat && formData.custom_location_lng
                      ? { lat: formData.custom_location_lat, lng: formData.custom_location_lng }
                      : null
                  }
                  customLocationType="marker"
                  customLocationPath={null}
                  onLocationTypeChange={handleLocationTypeChange}
                  onCommunityLocationChange={handleCommunityLocationChange}
                  onCustomLocationNameChange={handleCustomLocationNameChange}
                  onCustomLocationChange={handleCustomLocationChange}
                  disabled={hasActiveTransactions}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Visibility</Label>
                </div>

                <RadioGroup
                  value={formData.visibility_scope}
                  onValueChange={(value) => setFormData({ ...formData, visibility_scope: value as "community" | "neighborhood", neighborhood_ids: [] })}
                  disabled={hasActiveTransactions}
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <RadioGroupItem value="community" id="community" className="mt-1" disabled={hasActiveTransactions} />
                      <div className="flex-1">
                        <Label htmlFor="community" className="font-medium cursor-pointer">
                          Community-Wide
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <RadioGroupItem value="neighborhood" id="neighborhood" className="mt-1" disabled={hasActiveTransactions} />
                      <div className="flex-1">
                        <Label htmlFor="neighborhood" className="font-medium cursor-pointer">
                          Neighborhood-Only
                        </Label>
                        {formData.visibility_scope === "neighborhood" && (
                          <div className="mt-4 space-y-3">
                            <Label className="text-sm font-medium">Select Neighborhoods <span className="text-destructive">*</span></Label>
                            {neighborhoods.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No neighborhoods available</p>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto rounded-md border p-3">
                                {neighborhoods.map((neighborhood) => (
                                  <div key={neighborhood.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`neighborhood-${neighborhood.id}`}
                                      checked={formData.neighborhood_ids.includes(neighborhood.id)}
                                      onCheckedChange={() => toggleNeighborhood(neighborhood.id)}
                                      disabled={hasActiveTransactions}
                                    />
                                    <Label
                                      htmlFor={`neighborhood-${neighborhood.id}`}
                                      className="text-sm font-normal cursor-pointer"
                                    >
                                      {neighborhood.name}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </DialogContent>
    </Dialog>
  )
}
