"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, Filter, X, ArrowUpDown, Tag, DollarSign, Sparkles, CheckCircle2 } from 'lucide-react'
import { ExchangeListingCard } from "@/components/exchange/exchange-listing-card"
import { ExchangeListingDetailModal } from "@/components/exchange/exchange-listing-detail-modal"
import { ExchangeFilterCards, type FilterSectionType } from "@/components/exchange/exchange-filter-cards"
import { RioEmptyState } from "@/components/exchange/rio-empty-state"
import { getCategoryEmoji } from "@/lib/exchange-category-emojis"
import type { ExchangePricingType, ExchangeCondition } from "@/types/exchange"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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
  coordinates?: { lat: number; lng: number } | null
}

type FilterSection = FilterSectionType

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
  const [activeFilter, setActiveFilter] = useState<FilterSection>(null)

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
    setActiveFilter(null)
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
          />
        </div>

        {/* Filter Cards */}
        <ExchangeFilterCards
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-primary hover:text-primary hover:bg-primary/10"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Collapsible Filter Panel */}
        <AnimatePresence mode="wait">
          {activeFilter && (
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-2 border-muted/50">
                <CardContent className="p-4">
                  {activeFilter === "categories" && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Select Categories</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                              <span className="text-base leading-none">{getCategoryEmoji(category.name)}</span>
                              {category.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeFilter === "price" && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Pricing Type</h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "all", label: "All" },
                          { value: "free", label: "Free" },
                          { value: "fixed_price", label: "Fixed Price" },
                          { value: "pay_what_you_want", label: "Pay What You Want" },
                        ].map((option) => (
                          <Badge
                            key={option.value}
                            variant={pricingType === option.value ? "default" : "outline"}
                            className="cursor-pointer px-3 py-1.5"
                            onClick={() => setPricingType(option.value)}
                          >
                            {option.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeFilter === "condition" && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Item Condition</h4>
                      <div className="flex flex-wrap gap-2">
                        {conditionOptions.map((option) => (
                          <Badge
                            key={option.value}
                            variant={selectedConditions.includes(option.value) ? "default" : "outline"}
                            className="cursor-pointer px-3 py-1.5"
                            onClick={() => handleConditionToggle(option.value)}
                          >
                            {option.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeFilter === "availability" && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Availability</h4>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="show-unavailable"
                          checked={showUnavailable}
                          onCheckedChange={(checked) => setShowUnavailable(checked as boolean)}
                        />
                        <Label htmlFor="show-unavailable" className="cursor-pointer text-sm font-normal">
                          Include unavailable listings
                        </Label>
                      </div>
                    </div>
                  )}

                  {activeFilter === "sort" && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Sort By</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedListings.length} of {listings.length} listings
      </div>

      {filteredAndSortedListings.length === 0 ? (
        <RioEmptyState
          variant={hasActiveFilters ? "no-matches" : "no-listings"}
          title={hasActiveFilters ? "No listings match your filters" : "No listings yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters to see more results."
              : "Be the first to share something with your community!"
          }
          className="py-0 [&>div:first-child]:w-40 [&>div:first-child]:h-40 [&>div:first-child]:mb-2 [&>div:last-child]:mt-4"
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            ) : undefined
          }
        />
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
