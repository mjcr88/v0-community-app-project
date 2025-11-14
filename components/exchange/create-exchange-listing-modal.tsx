"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { createExchangeListing, getExchangeCategories } from "@/app/actions/exchange-listings"
import { getNeighborhoods } from "@/app/actions/neighborhoods"
import { LocationSelector } from "@/components/event-forms/location-selector"
import type { LocationType } from "@/components/event-forms/location-selector"
import { Loader2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import type { ExchangePricingType, ExchangeCondition } from "@/types/exchange"

interface CreateExchangeListingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantSlug: string
  tenantId: string
}

export function CreateExchangeListingModal({
  open,
  onOpenChange,
  tenantSlug,
  tenantId,
}: CreateExchangeListingModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [neighborhoods, setNeighborhoods] = useState<Array<{ id: string; name: string }>>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    pricing_type: "free" as ExchangePricingType,
    price: "",
    condition: "" as ExchangeCondition | "",
    available_quantity: "",
    status: "draft" as "draft" | "published",
    location_type: "none" as LocationType,
    community_location_id: null as string | null,
    custom_location_name: null as string | null,
    custom_location_coordinates: null as { lat: number; lng: number } | null,
    custom_location_type: null as "marker" | "polygon" | null,
    custom_location_path: null as Array<{ lat: number; lng: number }> | null,
    visibility_scope: "community" as "community" | "neighborhood",
    neighborhood_ids: [] as string[],
  })

  // Load categories and neighborhoods when modal opens
  useEffect(() => {
    if (open) {
      loadCategories()
      loadNeighborhoods()
    }
  }, [open, tenantId])

  const loadCategories = async () => {
    setIsLoadingCategories(true)
    const categoriesData = await getExchangeCategories(tenantId)
    setCategories(categoriesData)
    setIsLoadingCategories(false)
  }

  const loadNeighborhoods = async () => {
    const result = await getNeighborhoods(tenantId)
    if (result.success) {
      setNeighborhoods(result.data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
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

      if (formData.location_type === "custom") {
        if (!formData.custom_location_name?.trim()) {
          toast({
            title: "Location name required",
            description: "Please enter a name for your custom location",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
        if (!formData.custom_location_coordinates) {
          toast({
            title: "Location coordinates required",
            description: "Please select a location on the map",
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
        status: formData.status,
        location_type: formData.location_type,
        community_location_id: formData.community_location_id,
        custom_location_name: formData.custom_location_name,
        custom_location_coordinates: formData.custom_location_coordinates,
        custom_location_type: formData.custom_location_type,
        custom_location_path: formData.custom_location_path,
        visibility_scope: formData.visibility_scope,
        neighborhood_ids: formData.neighborhood_ids,
      }

      const result = await createExchangeListing(tenantSlug, tenantId, listingData)

      if (result.success) {
        toast({
          title: formData.status === "published" ? "Listing published!" : "Draft saved!",
          description:
            formData.status === "published"
              ? "Your listing is now visible to the community."
              : "You can continue editing and publish when ready.",
        })
        onOpenChange(false)
        // Reset form
        setFormData({
          title: "",
          description: "",
          category_id: "",
          pricing_type: "free",
          price: "",
          condition: "",
          available_quantity: "",
          status: "draft",
          location_type: "none",
          community_location_id: null,
          custom_location_name: null,
          custom_location_coordinates: null,
          custom_location_type: null,
          custom_location_path: null,
          visibility_scope: "community",
          neighborhood_ids: [],
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create listing",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Listing creation error:", error)
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
  const isServicesSkills = selectedCategory?.name === "Services & Skills"
  const showPricing = selectedCategory && !isToolsEquipment // Show for all except Tools & Equipment
  const showCondition = isToolsEquipment // Show only for Tools & Equipment
  const showQuantity = isToolsEquipment || isFoodProduce // Show for Tools & Equipment and Food & Produce
  const locationOptional = isServicesSkills

  const handleLocationTypeChange = useCallback((type: LocationType) => {
    setFormData((prev) => ({ ...prev, location_type: type }))
  }, [])

  const handleCommunityLocationChange = useCallback((id: string | null) => {
    setFormData((prev) => ({ ...prev, community_location_id: id }))
  }, [])

  const handleCustomLocationNameChange = useCallback((name: string | null) => {
    setFormData((prev) => ({ ...prev, custom_location_name: name }))
  }, [])

  const handleCustomLocationChange = useCallback((data: {
    coordinates?: { lat: number; lng: number } | null
    type?: "marker" | "polygon" | null
    path?: Array<{ lat: number; lng: number }> | null
  }) => {
    setFormData((prev) => ({
      ...prev,
      custom_location_coordinates: data.coordinates ?? null,
      custom_location_type: data.type ?? null,
      custom_location_path: data.path ?? null,
    }))
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Exchange Listing</DialogTitle>
          <DialogDescription>Share something with your community - tools, food, services, and more</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Listing Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Tall Ladder, Fresh Mangos, Graphic Design Services..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Keep it clear and descriptive</p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                {isLoadingCategories ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading categories...
                  </div>
                ) : (
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    required
                  >
                    <SelectTrigger id="category">
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
                )}
                <p className="text-xs text-muted-foreground">
                  Choose the category that best fits what you're offering
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell your community more about this item or service..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Add details like condition, availability, or special instructions
                </p>
              </div>

              {/* Pricing */}
              {showPricing && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Pricing</Label>
                    <p className="text-sm text-muted-foreground">How would you like to handle pricing?</p>
                  </div>

                  <RadioGroup
                    value={formData.pricing_type}
                    onValueChange={(value) => setFormData({ ...formData, pricing_type: value as ExchangePricingType, price: "" })}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 rounded-md border p-4">
                        <RadioGroupItem value="free" id="free" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="free" className="font-medium cursor-pointer">
                            Free
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Offer this item or service at no cost
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 rounded-md border p-4">
                        <RadioGroupItem value="fixed_price" id="fixed_price" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="fixed_price" className="font-medium cursor-pointer">
                            Fixed Price
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Set a specific price for your offering
                          </p>
                          {formData.pricing_type === "fixed_price" && (
                            <div className="mt-3">
                              <Label htmlFor="price" className="sr-only">Price</Label>
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
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 rounded-md border p-4">
                        <RadioGroupItem value="pay_what_you_want" id="pay_what_you_want" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="pay_what_you_want" className="font-medium cursor-pointer">
                            Pay What You Want
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Let people choose what they'd like to pay
                          </p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Condition */}
              {showCondition && (
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value as ExchangeCondition })}
                  >
                    <SelectTrigger id="condition">
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
                  <p className="text-xs text-muted-foreground">
                    Let borrowers know the current state of your tool or equipment
                  </p>
                </div>
              )}

              {/* Quantity */}
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
                    {isFoodProduce 
                      ? "E.g., 10 mangos, 5 loaves of bread"
                      : "E.g., how many tools are available to lend"}
                  </p>
                </div>
              )}

              {selectedCategory && (
                <LocationSelector
                  tenantId={tenantId}
                  locationType={formData.location_type}
                  communityLocationId={formData.community_location_id}
                  customLocationName={formData.custom_location_name}
                  customLocationCoordinates={formData.custom_location_coordinates}
                  customLocationType={formData.custom_location_type}
                  customLocationPath={formData.custom_location_path}
                  onLocationTypeChange={handleLocationTypeChange}
                  onCommunityLocationChange={handleCommunityLocationChange}
                  onCustomLocationNameChange={handleCustomLocationNameChange}
                  onCustomLocationChange={handleCustomLocationChange}
                />
              )}
              {locationOptional && formData.location_type === "none" && (
                <p className="text-xs text-muted-foreground italic pl-6 -mt-2">
                  Location is optional for services - you can coordinate directly with interested residents
                </p>
              )}

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Visibility</Label>
                  <p className="text-sm text-muted-foreground">Who can see this listing?</p>
                </div>

                <RadioGroup
                  value={formData.visibility_scope}
                  onValueChange={(value) => setFormData({ ...formData, visibility_scope: value as "community" | "neighborhood", neighborhood_ids: [] })}
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <RadioGroupItem value="community" id="visibility-community" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="visibility-community" className="font-medium cursor-pointer">
                          Community-wide
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          All residents can see this listing
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <RadioGroupItem value="neighborhood" id="visibility-neighborhood" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="visibility-neighborhood" className="font-medium cursor-pointer">
                          Neighborhood-only
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Only residents in selected neighborhoods can see this listing
                        </p>
                        {formData.visibility_scope === "neighborhood" && (
                          <div className="mt-3 space-y-2 border-t pt-3">
                            <Label className="text-sm font-medium">Select Neighborhoods</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {neighborhoods.map((neighborhood) => (
                                <div key={neighborhood.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`neighborhood-${neighborhood.id}`}
                                    checked={formData.neighborhood_ids.includes(neighborhood.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFormData({
                                          ...formData,
                                          neighborhood_ids: [...formData.neighborhood_ids, neighborhood.id],
                                        })
                                      } else {
                                        setFormData({
                                          ...formData,
                                          neighborhood_ids: formData.neighborhood_ids.filter((id) => id !== neighborhood.id),
                                        })
                                      }
                                    }}
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
                            {neighborhoods.length === 0 && (
                              <p className="text-sm text-muted-foreground italic">No neighborhoods available</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Status Selection */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Listing Status</Label>
                  <p className="text-sm text-muted-foreground">Choose whether to publish now or save as draft</p>
                </div>

                <RadioGroup
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as "draft" | "published" })}
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <RadioGroupItem value="draft" id="draft" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="draft" className="font-medium cursor-pointer">
                          Save as Draft
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Save your listing privately and continue editing later
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <RadioGroupItem value="published" id="published" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="published" className="font-medium cursor-pointer">
                          Publish Now
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Make your listing visible to the community immediately
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting
                    ? "Creating..."
                    : formData.status === "published"
                      ? "Publish Listing"
                      : "Save Draft"}
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
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
