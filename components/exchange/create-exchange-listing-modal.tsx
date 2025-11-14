"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { createExchangeListing } from "@/app/actions/exchange-listings"
import { Loader2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import type { ExchangePricingType, ExchangeCondition } from "@/types/exchange"
import { LocationSelector } from "@/components/event-forms/location-selector"

interface CreateExchangeListingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantSlug: string
  tenantId: string
  categories: Array<{ id: string; name: string }>
  neighborhoods: Array<{ id: string; name: string }>
}

export function CreateExchangeListingModal({
  open,
  onOpenChange,
  tenantSlug,
  tenantId,
  categories,
  neighborhoods,
}: CreateExchangeListingModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    status: "draft" as "draft" | "published",
  })

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
        status: formData.status,
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
        setFormData({
          title: "",
          description: "",
          category_id: "",
          pricing_type: "free",
          price: "",
          condition: "",
          available_quantity: "",
          visibility_scope: "community",
          neighborhood_ids: [],
          location_type: "none",
          location_id: null,
          custom_location_name: "",
          custom_location_lat: null,
          custom_location_lng: null,
          status: "draft",
        })
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create listing",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Listing creation error:", error)
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
      location_id: null,
      custom_location_name: "",
      custom_location_lat: null,
      custom_location_lng: null,
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

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
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
                <p className="text-xs text-muted-foreground">
                  Choose the category that best fits what you're offering
                </p>
              </div>

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

              <div className="space-y-2 pt-4 border-t">
                <Label className="text-base font-semibold">Location (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Add a location to help community members find this item or service
                </p>
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
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Visibility</Label>
                  <p className="text-sm text-muted-foreground">Who should be able to see this listing?</p>
                </div>

                <RadioGroup
                  value={formData.visibility_scope}
                  onValueChange={(value) => setFormData({ ...formData, visibility_scope: value as "community" | "neighborhood", neighborhood_ids: [] })}
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <RadioGroupItem value="community" id="community" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="community" className="font-medium cursor-pointer">
                          Community-Wide
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Visible to all residents in the community
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <RadioGroupItem value="neighborhood" id="neighborhood" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="neighborhood" className="font-medium cursor-pointer">
                          Neighborhood-Only
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Only visible to residents in specific neighborhoods
                        </p>
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
