"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Filter } from "lucide-react"
import { MapboxFullViewer } from "@/components/map/MapboxViewer"
import { Input } from "@/components/ui/input"
import { MapAnalytics } from "@/lib/analytics"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CommunityMapClientProps {
    slug: string
    tenantId: string
    counts: any
    locations: any[]
    checkIns?: any[]
    mapCenter: { lat: number; lng: number } | null
    boundaryLocationId?: string
    mapZoom?: number
    initialTypeFilter?: string
}

export function CommunityMapClient({
    slug,
    tenantId,
    locations,
    checkIns = [],
    mapCenter,
    mapZoom = 14,
}: CommunityMapClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set())
    const [highlightedLocationId, setHighlightedLocationId] = useState<string | null>(null)
    const [showSearchResults, setShowSearchResults] = useState(false)

    // Filter locations based on search query
    const filteredLocations = useMemo(() => {
        if (!searchQuery.trim()) return []
        const query = searchQuery.toLowerCase()
        return locations.filter((loc) =>
            loc.name.toLowerCase().includes(query) ||
            loc.description?.toLowerCase().includes(query) ||
            loc.type.toLowerCase().includes(query)
        ).slice(0, 5)
    }, [searchQuery, locations])

    // Debounced search analytics
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 2) {
                MapAnalytics.searched(searchQuery.length, filteredLocations.length)
            }
        }, 1500) // Debounce 1.5s

        return () => clearTimeout(timer)
    }, [searchQuery, filteredLocations.length])

    // Calculate type counts
    const typeCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        locations.forEach((loc) => {
            counts[loc.type] = (counts[loc.type] || 0) + 1
        })
        return counts
    }, [locations])

    const filterOptions = [
        { id: "boundary", label: "Boundary", type: "boundary", icon: "🗺️" },
        { id: "lots", label: "Lots", type: "lot", icon: "🏡" },
        { id: "facilities", label: "Facilities", type: "facility", icon: "🏛️" },
        { id: "streets", label: "Streets", type: "public_street", icon: "🛣️" },
        { id: "paths", label: "Paths", type: "walking_path", icon: "🚶" },
        { id: "checkins", label: "Check-ins", type: "checkin", icon: "📍" },
    ]

    const toggleFilter = (type: string) => {
        const newFilters = new Set(selectedFilters)
        if (newFilters.has(type)) {
            newFilters.delete(type)
        } else {
            newFilters.add(type)
        }
        setSelectedFilters(newFilters)
    }

    const handleLocationSelect = (location: any) => {
        setHighlightedLocationId(location.id)
        setSearchQuery("") // Optional: clear search after selection
        setShowSearchResults(false)
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] w-full gap-4">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Community Map</h1>
                <p className="text-muted-foreground">
                    Explore your community, find neighbors, and discover local amenities.
                </p>
            </div>

            {/* Mobile Search & Filters */}
            <div className="md:hidden flex flex-col gap-2 relative z-50">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search locations..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setShowSearchResults(true)
                        }}
                        onFocus={() => setShowSearchResults(true)}
                        className="pl-10"
                    />
                    {/* Search Results Dropdown */}
                    {showSearchResults && searchQuery.trim() && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md overflow-hidden z-50">
                            {filteredLocations.length > 0 ? (
                                <div className="max-h-[200px] overflow-y-auto">
                                    {filteredLocations.map((loc) => (
                                        <button
                                            key={loc.id}
                                            className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground text-sm flex items-center gap-2"
                                            onClick={() => handleLocationSelect(loc)}
                                        >
                                            <span>{loc.icon || "📍"}</span>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="truncate font-medium">{loc.name}</span>
                                                <span className="text-xs text-muted-foreground capitalize truncate">
                                                    {loc.type.replace("_", " ")}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-sm text-muted-foreground text-center">
                                    No locations found
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* List View Overlay (when search has results) */}
                {searchQuery && filteredLocations.length > 0 && !highlightedLocationId && (
                    <div className="absolute top-[60px] left-0 right-0 bottom-0 bg-background/95 backdrop-blur-sm z-40 overflow-y-auto p-4 rounded-t-xl border-t shadow-lg transition-all duration-300 ease-in-out" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">
                                Search Results
                                <span className="ml-2 text-muted-foreground font-normal">
                                    ({filteredLocations.length})
                                </span>
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery("")
                                }}
                            >
                                Clear
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {filteredLocations.map((loc) => (
                                <div
                                    key={loc.id}
                                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                                    onClick={() => handleLocationSelect(loc)}
                                >
                                    <div className="text-2xl">{loc.icon || "📍"}</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate">{loc.name}</h4>
                                        <p className="text-xs text-muted-foreground capitalize mb-1">
                                            {loc.type.replace("_", " ")}
                                        </p>
                                        {loc.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {loc.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {filteredLocations.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No locations found matching your criteria.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Map Container */}
            <div className="flex-1 rounded-xl overflow-hidden border shadow-sm">
                <MapboxFullViewer
                    locations={locations}
                    checkIns={checkIns}
                    tenantId={tenantId}
                    tenantSlug={slug}
                    mapCenter={mapCenter}
                    mapZoom={mapZoom}
                    showControls={true}
                    isFullPage={true}
                    externalHighlightedCategories={selectedFilters}
                    highlightLocationId={highlightedLocationId}
                    className="h-full w-full"
                />
            </div>
        </div>
    )
}
