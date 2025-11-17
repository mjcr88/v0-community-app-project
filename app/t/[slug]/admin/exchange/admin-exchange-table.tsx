"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowUpDown, Flag, MapPin, Search, X, Trash2, Archive, FlagOff, ChevronDown } from 'lucide-react'
import Link from "next/link"
import { formatDate } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ClearFlagDialog } from "./clear-flag-dialog"
import { ArchiveListingsDialog } from "./archive-listings-dialog"
import { DeleteListingsDialog } from "./delete-listings-dialog"

type AdminListing = {
  id: string
  title: string
  description: string | null
  status: string
  is_available: boolean
  pricing_type: string
  price: number | null
  condition: string | null
  available_quantity: number | null
  created_at: string
  published_at: string | null
  category_id: string | null
  photos: string[]
  hero_photo: string | null
  location_name: string | null
  exchange_categories: {
    id: string
    name: string
    description: string | null
  } | null
  users: {
    id: string
    first_name: string
    last_name: string
    email: string
  } | null
  flag_count: number
}

type Category = {
  id: string
  name: string
  description: string | null
}

export function AdminExchangeTable({
  listings,
  slug,
  tenantId,
  categories,
}: {
  listings: AdminListing[]
  slug: string
  tenantId: string
  categories: Category[]
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortedListings, setSortedListings] = useState<AdminListing[]>(listings)
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedListings, setSelectedListings] = useState<string[]>([])

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all")
  const [pricingTypeFilter, setPricingTypeFilter] = useState<string>("all")
  const [conditionFilter, setConditionFilter] = useState<string>("all")
  const [flaggedFilter, setFlaggedFilter] = useState<string>("all")

  const filteredListings = useMemo(() => {
    let filtered = listings

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((listing) => {
        if (listing.title.toLowerCase().includes(query)) return true
        if (listing.description?.toLowerCase().includes(query)) return true
        if (listing.exchange_categories?.name.toLowerCase().includes(query)) return true
        if (listing.users) {
          const creatorName = `${listing.users.first_name} ${listing.users.last_name}`.toLowerCase()
          if (creatorName.includes(query)) return true
        }
        if (listing.status.toLowerCase().includes(query)) return true
        if (listing.location_name?.toLowerCase().includes(query)) return true
        return false
      })
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((listing) => listing.category_id && selectedCategories.includes(listing.category_id))
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((listing) => listing.status === statusFilter)
    }

    if (availabilityFilter !== "all") {
      const isAvailable = availabilityFilter === "available"
      filtered = filtered.filter((listing) => listing.is_available === isAvailable)
    }

    if (pricingTypeFilter !== "all") {
      filtered = filtered.filter((listing) => listing.pricing_type === pricingTypeFilter)
    }

    if (conditionFilter !== "all") {
      filtered = filtered.filter((listing) => listing.condition === conditionFilter)
    }

    if (flaggedFilter === "flagged") {
      filtered = filtered.filter((listing) => listing.flag_count > 0)
    } else if (flaggedFilter === "not_flagged") {
      filtered = filtered.filter((listing) => listing.flag_count === 0)
    }

    return filtered
  }, [
    listings,
    searchQuery,
    selectedCategories,
    statusFilter,
    availabilityFilter,
    pricingTypeFilter,
    conditionFilter,
    flaggedFilter,
  ])

  useEffect(() => {
    setSortedListings(filteredListings)
  }, [filteredListings])

  const handleSort = (field: string) => {
    const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(direction)

    const sorted = [...filteredListings].sort((a, b) => {
      let aVal: any = a[field as keyof AdminListing]
      let bVal: any = b[field as keyof AdminListing]

      if (field === "category") {
        aVal = a.exchange_categories?.name?.toLowerCase() || ""
        bVal = b.exchange_categories?.name?.toLowerCase() || ""
      } else if (field === "creator") {
        aVal = `${a.users?.last_name} ${a.users?.first_name}`.toLowerCase()
        bVal = `${b.users?.last_name} ${b.users?.first_name}`.toLowerCase()
      } else if (field === "location_name") {
        aVal = a.location_name?.toLowerCase() || ""
        bVal = b.location_name?.toLowerCase() || ""
      } else if (field === "flag_count") {
        aVal = a.flag_count || 0
        bVal = b.flag_count || 0
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase()
      }

      if (typeof bVal === "string") {
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1
      if (aVal > bVal) return direction === "asc" ? 1 : -1
      return 0
    })

    setSortedListings(sorted)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedListings(sortedListings.map((l) => l.id))
    } else {
      setSelectedListings([])
    }
  }

  const handleSelectListing = (listingId: string, checked: boolean) => {
    if (checked) {
      setSelectedListings([...selectedListings, listingId])
    } else {
      setSelectedListings(selectedListings.filter((id) => id !== listingId))
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
    setStatusFilter("all")
    setAvailabilityFilter("all")
    setPricingTypeFilter("all")
    setConditionFilter("all")
    setFlaggedFilter("all")
  }

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategories.length > 0 ||
    statusFilter !== "all" ||
    availabilityFilter !== "all" ||
    pricingTypeFilter !== "all" ||
    conditionFilter !== "all" ||
    flaggedFilter !== "all"

  const getListingDate = (listing: AdminListing) => {
    try {
      const date = new Date(listing.published_at || listing.created_at)
      return formatDate(date, "MMM d, yyyy")
    } catch {
      return listing.created_at
    }
  }

  const getPricingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fixed_price: "Fixed Price",
      free: "Free",
      trade: "Trade",
      negotiable: "Negotiable",
    }
    return labels[type] || type
  }

  const getConditionLabel = (condition: string | null) => {
    if (!condition) return "—"
    const labels: Record<string, string> = {
      new: "New",
      like_new: "Like New",
      good: "Good",
      fair: "Fair",
      poor: "Poor",
    }
    return labels[condition] || condition
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const formatPrice = (price: number | null, pricingType: string) => {
    if (pricingType === "free") return "Free"
    if (pricingType === "trade") return "Trade"
    if (pricingType === "negotiable") return "Negotiable"
    if (price === null) return "—"
    return `$${price.toFixed(2)}`
  }

  const selectedListingTitles = useMemo(() => {
    return sortedListings
      .filter(listing => selectedListings.includes(listing.id))
      .map(listing => listing.title)
  }, [selectedListings, sortedListings])

  const selectedListingTitle = selectedListings.length === 1 ? selectedListingTitles[0] : undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            {filteredListings.length} of {listings.length} listing{listings.length !== 1 ? "s" : ""}
          </div>
        )}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear all filters
          </Button>
        )}
      </div>

      {selectedListings.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedListings.length} listing{selectedListings.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <DeleteListingsDialog
              listingIds={selectedListings}
              listingTitle={selectedListingTitle}
              tenantId={tenantId}
              tenantSlug={slug}
              triggerSize="sm"
            />
            <ArchiveListingsDialog
              listingIds={selectedListings}
              listingTitle={selectedListingTitle}
              tenantId={tenantId}
              tenantSlug={slug}
              triggerSize="sm"
            />
            <ClearFlagDialog
              listingIds={selectedListings}
              listingTitles={selectedListingTitles}
              tenantId={tenantId}
              tenantSlug={slug}
              triggerSize="sm"
            />
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedListings.length === sortedListings.length && sortedListings.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("title")} className="-ml-3">
                  Title
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("location_name")} className="-ml-3">
                  Location
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("creator")} className="-ml-3">
                  Creator
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Category
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {selectedCategories.length > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          {selectedCategories.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {categories.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category.id}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories([...selectedCategories, category.id])
                          } else {
                            setSelectedCategories(selectedCategories.filter((id) => id !== category.id))
                          }
                        }}
                      >
                        {category.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>Price</TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Condition
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {conditionFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by condition</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setConditionFilter("all")}>All</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setConditionFilter("new")}>New</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setConditionFilter("like_new")}>Like New</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setConditionFilter("good")}>Good</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setConditionFilter("fair")}>Fair</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setConditionFilter("poor")}>Poor</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Status
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {statusFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("published")}>Published</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("draft")}>Draft</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Availability
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {availabilityFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by availability</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setAvailabilityFilter("all")}>All</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAvailabilityFilter("available")}>Available</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAvailabilityFilter("unavailable")}>Unavailable</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      <Flag className="h-4 w-4 mr-2" />
                      <ChevronDown className="h-4 w-4" />
                      {flaggedFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by flags</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFlaggedFilter("all")}>All listings</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFlaggedFilter("flagged")}>Flagged only</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFlaggedFilter("not_flagged")}>Not flagged</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedListings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground">
                  {hasActiveFilters ? "No listings found matching your filters" : "No listings found"}
                </TableCell>
              </TableRow>
            ) : (
              sortedListings.map((listing) => (
                <TableRow key={listing.id} className={!listing.is_available ? "opacity-60" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedListings.includes(listing.id)}
                      onCheckedChange={(checked) => handleSelectListing(listing.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      {listing.hero_photo ? (
                        <AvatarImage src={listing.hero_photo || "/placeholder.svg"} alt={listing.title} />
                      ) : (
                        <AvatarFallback>
                          {listing.pricing_type === "free" ? "🎁" : listing.pricing_type === "trade" ? "🔄" : "💰"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/t/${slug}/dashboard/exchange`}
                      className="font-medium hover:underline line-clamp-1"
                    >
                      {listing.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {listing.location_name ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="line-clamp-1">{listing.location_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {listing.users ? getInitials(listing.users.first_name, listing.users.last_name) : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {listing.users ? `${listing.users.first_name} ${listing.users.last_name}` : "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {listing.exchange_categories ? (
                      <span className="text-sm">{listing.exchange_categories.name}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatPrice(listing.price, listing.pricing_type)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{getConditionLabel(listing.condition)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={listing.status === "published" ? "default" : "secondary"}>{listing.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={listing.is_available ? "default" : "secondary"}>
                      {listing.is_available ? "Available" : "Unavailable"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{listing.available_quantity ?? "—"}</span>
                  </TableCell>
                  <TableCell>
                    {listing.flag_count > 0 && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <Flag className="h-4 w-4" />
                        <span className="text-sm font-medium">{listing.flag_count}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm text-muted-foreground">{getListingDate(listing)}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
