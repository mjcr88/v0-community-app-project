"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, X, ChevronDown, Package, ArrowUpDown } from 'lucide-react'
import { ExchangeListingCard } from "@/components/exchange/exchange-listing-card"
import { ExchangeListingDetailModal } from "@/components/exchange/exchange-listing-detail-modal"
import type { ExchangePricingType, ExchangeCondition } from "@/types/exchange"

interface Listing {
  id: string
  title: string
  description: string | null
  status: string
  is_available: boolean
  pricing_type: ExchangePricingType
  price: number | null
  condition: ExchangeCondition | null
  available_quantity: number | null
  photos: string[]
  hero_photo: string | null
  custom_location_name: string | null
  category: {
    id: string
    name: string
    description: string | null
  } | null
  creator: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  } | null
  location: {
    name: string
  } | null
}

interface Category {
  id: string
  name: string
  description: string | null
}

interface Neighborhood {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  type: string
  coordinates?: { lat: number; lng: number }
}

export function ExchangePageClient({
  listings,
  categories,
  neighborhoods,
  locations,
  tenantId,
  tenantSlug,
  userId,
  userRole,
  isAdmin = false,
}: {
  listings: Listing[]
  categories: Category[]
  neighborhoods: Neighborhood[]
  locations: Location[]
  tenantId: string
  tenantSlug: string
  userId: string | null
  userRole?: string | null
  isAdmin?: boolean
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [pricingType, setPricingType] = useState("all")
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [showUnavailable, setShowUnavailable] = useState(false)
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("newest")
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const filteredAndSortedListings = useMemo(() => {
    let filtered = listings.filter((listing) => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const titleMatch = listing.title.toLowerCase().includes(searchLower)
        const descMatch = listing.description?.toLowerCase().includes(searchLower) || false
        if (!titleMatch && !descMatch) return false
      }

      // Category filter
      if (selectedCategories.length > 0) {
        if (!listing.category?.id || !selectedCategories.includes(listing.category.id)) {
          return false
        }
      }

      // Pricing type filter
      if (pricingType !== "all") {
        if (listing.pricing_type !== pricingType) return false
      }

      // Condition filter
      if (selectedConditions.length > 0) {
        if (!listing.condition || !selectedConditions.includes(listing.condition)) {
          return false
        }
      }

      // Availability filter
      if (!showUnavailable && !listing.is_available) return false

      // TODO: Neighborhood filter (requires exchange_neighborhoods join)
      // Will implement once we confirm data structure

      return true
    })

    // Sort logic
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return 0 // Will use created_at when available
        case "price-low":
          return (a.price || 0) - (b.price || 0)
        case "price-high":
          return (b.price || 0) - (a.price || 0)
        case "title-asc":
          return a.title.localeCompare(b.title)
        case "title-desc":
          return b.title.localeCompare(a.title)
        case "category-asc":
          return (a.category?.name || "").localeCompare(b.category?.name || "")
        case "category-desc":
          return (b.category?.name || "").localeCompare(a.category?.name || "")
        case "condition-best":
          const conditionOrder = ["new", "slightly_used", "used", "slightly_damaged", "maintenance"]
          return conditionOrder.indexOf(a.condition || "") - conditionOrder.indexOf(b.condition || "")
        case "condition-worst":
          const conditionOrderReverse = ["new", "slightly_used", "used", "slightly_damaged", "maintenance"]
          return conditionOrderReverse.indexOf(b.condition || "") - conditionOrderReverse.indexOf(a.condition || "")
        case "newest":
        default:
          return 0 // Already sorted by created_at DESC from server
      }
    })

    return sorted
  }, [listings, searchQuery, selectedCategories, pricingType, selectedConditions, showUnavailable, selectedNeighborhoods, sortBy])

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
  }

  const handleConditionToggle = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    )
  }

  const handleNeighborhoodToggle = (neighborhoodId: string) => {
    setSelectedNeighborhoods((prev) =>
      prev.includes(neighborhoodId) ? prev.filter((id) => id !== neighborhoodId) : [...prev, neighborhoodId]
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
    setPricingType("all")
    setSelectedConditions([])
    setShowUnavailable(false)
    setSelectedNeighborhoods([])
    setSortBy("newest")
  }

  const hasActiveFilters =
    searchQuery ||
    selectedCategories.length > 0 ||
    pricingType !== "all" ||
    selectedConditions.length > 0 ||
    showUnavailable ||
    selectedNeighborhoods.length > 0

  const conditionOptions = [
    { value: "new", label: "New" },
    { value: "slightly_used", label: "Slightly Used" },
    { value: "used", label: "Used" },
    { value: "slightly_damaged", label: "Slightly Damaged" },
    { value: "maintenance", label: "Needs Maintenance" },
  ]

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "title-asc", label: "Title: A to Z" },
    { value: "title-desc", label: "Title: Z to A" },
    { value: "category-asc", label: "Category: A to Z" },
    { value: "category-desc", label: "Category: Z to A" },
    { value: "condition-best", label: "Condition: Best to Worst" },
    { value: "condition-worst", label: "Condition: Worst to Best" },
  ]

  const handleCardClick = (listingId: string) => {
    setSelectedListingId(listingId)
    setIsDetailModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between bg-transparent">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Categories
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedCategories.length}
                    </Badge>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Select Categories</h4>
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                    />
                    <Label
                      htmlFor={`category-${category.id}`}
                      className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                    >
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between bg-transparent">
                <span className="flex items-center gap-2">
                  Price Type
                  {pricingType !== "all" && (
                    <Badge variant="secondary" className="ml-1 capitalize">
                      {pricingType.replace("_", " ")}
                    </Badge>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Pricing Type</h4>
                {[
                  { value: "all", label: "All" },
                  { value: "free", label: "Free" },
                  { value: "fixed_price", label: "Fixed Price" },
                  { value: "pay_what_you_want", label: "Pay What You Want" },
                ].map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`pricing-${option.value}`}
                      checked={pricingType === option.value}
                      onCheckedChange={() => setPricingType(option.value)}
                    />
                    <Label htmlFor={`pricing-${option.value}`} className="cursor-pointer text-sm font-normal flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between bg-transparent">
                <span className="flex items-center gap-2">
                  Condition
                  {selectedConditions.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedConditions.length}
                    </Badge>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Item Condition</h4>
                {conditionOptions.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`condition-${option.value}`}
                      checked={selectedConditions.includes(option.value)}
                      onCheckedChange={() => handleConditionToggle(option.value)}
                    />
                    <Label
                      htmlFor={`condition-${option.value}`}
                      className="cursor-pointer text-sm font-normal flex-1"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between bg-transparent">
                <span className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Sort By</h4>
                {sortOptions.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`sort-${option.value}`}
                      checked={sortBy === option.value}
                      onCheckedChange={() => setSortBy(option.value)}
                    />
                    <Label htmlFor={`sort-${option.value}`} className="cursor-pointer text-sm font-normal flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="show-unavailable"
            checked={showUnavailable}
            onCheckedChange={(checked) => setShowUnavailable(checked as boolean)}
          />
          <Label htmlFor="show-unavailable" className="cursor-pointer text-sm font-normal">
            Show unavailable items
          </Label>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
              </Badge>
            )}
            {selectedCategories.map((catId) => {
              const category = categories.find((c) => c.id === catId)
              return (
                <Badge key={catId} variant="secondary" className="gap-1">
                  {category?.name}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleCategoryToggle(catId)} />
                </Badge>
              )
            })}
            {pricingType !== "all" && (
              <Badge variant="secondary" className="gap-1 capitalize">
                {pricingType.replace("_", " ")}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setPricingType("all")} />
              </Badge>
            )}
            {selectedConditions.map((condition) => {
              const option = conditionOptions.find((o) => o.value === condition)
              return (
                <Badge key={condition} variant="secondary" className="gap-1">
                  {option?.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleConditionToggle(condition)} />
                </Badge>
              )
            })}
            {showUnavailable && (
              <Badge variant="secondary" className="gap-1">
                Show unavailable
                <X className="h-3 w-3 cursor-pointer" onClick={() => setShowUnavailable(false)} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7">
              Clear all
            </Button>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedListings.length} of {listings.length} listings
        </div>
      </div>

      {filteredAndSortedListings.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Package className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {hasActiveFilters ? "No listings match your filters" : "No listings yet"}
            </CardTitle>
            <CardDescription className="text-base">
              {hasActiveFilters
                ? "Try adjusting your search or filters to see more results."
                : "Be the first to share something with your community!"}
            </CardDescription>
          </CardHeader>
          {hasActiveFilters && (
            <CardContent className="flex justify-center pb-8">
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedListings.map((listing) => (
            <ExchangeListingCard 
              key={listing.id} 
              listing={listing}
              onClick={() => handleCardClick(listing.id)}
            />
          ))}
        </div>
      )}

      {selectedListingId && (
        <ExchangeListingDetailModal
          listingId={selectedListingId}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          userId={userId}
          userRole={userRole}
          isAdmin={isAdmin}
          locations={locations}
          categories={categories}
          neighborhoods={neighborhoods}
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
        />
      )}
    </div>
  )
}
