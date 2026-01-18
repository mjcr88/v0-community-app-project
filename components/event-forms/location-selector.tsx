"use client"

import { useState, useMemo, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, XCircle, Search, Check, X, Globe } from 'lucide-react'
import { MapboxFullViewer } from "@/components/map/MapboxViewer"
import { LocationWithRelations } from "@/lib/data/locations"

export type LocationType = "community" | "custom" | "none"

interface LocationSelectorProps {
  tenantId: string
  locationType: LocationType
  communityLocationId?: string | null
  customLocationName?: string | null
  customLocationCoordinates?: { lat: number; lng: number } | null
  customLocationType?: "marker" | "polygon" | null
  customLocationPath?: Array<{ lat: number; lng: number }> | null
  onLocationTypeChange: (type: LocationType) => void
  onCommunityLocationChange: (locationId: string, locationName?: string) => void
  onCustomLocationNameChange: (name: string) => void
  onCustomLocationChange: (data: {
    coordinates?: { lat: number; lng: number } | null
    type?: "marker" | "polygon" | null
    path?: Array<{ lat: number; lng: number }> | null
  }) => void
  restrictToCommunity?: boolean
}

const locationTypeLabels: Record<string, string> = {
  facility: "Facility",
  lot: "Lot",
  walking_path: "Walking Path",
  neighborhood: "Neighborhood",
  boundary: "Boundary",
  public_street: "Public Street",
  green_area: "Green Area",
  playground: "Playground",
  protection_zone: "Protection Zone",
  easement: "Easement",
  recreational_zone: "Recreational Zone",
}

const locationTypeColors: Record<string, string> = {
  facility: "bg-orange-100 text-orange-700 border-orange-300",
  lot: "bg-green-100 text-green-700 border-green-300",
  walking_path: "bg-lime-100 text-lime-700 border-lime-300",
  neighborhood: "bg-purple-100 text-purple-700 border-purple-300",
  boundary: "bg-blue-100 text-blue-700 border-blue-300",
  public_street: "bg-yellow-100 text-yellow-700 border-yellow-300",
  green_area: "bg-emerald-100 text-emerald-700 border-emerald-300",
  playground: "bg-pink-100 text-pink-700 border-pink-300",
  protection_zone: "bg-red-100 text-red-700 border-red-300",
  easement: "bg-gray-100 text-gray-700 border-gray-300",
  recreational_zone: "bg-cyan-100 text-cyan-700 border-cyan-300",
}

interface MapboxFeature {
  id: string
  place_name: string
  center: [number, number]
  text: string
  properties: {
    category?: string
    address?: string
  }
}

export function LocationSelector({
  tenantId,
  locationType,
  communityLocationId,
  customLocationName,
  customLocationCoordinates,
  customLocationType,
  customLocationPath,
  onLocationTypeChange,
  onCommunityLocationChange,
  onCustomLocationNameChange,
  onCustomLocationChange,
  restrictToCommunity = false,
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<LocationWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [mapboxResults, setMapboxResults] = useState<MapboxFeature[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [mapZoom, setMapZoom] = useState<number>(14)
  const [tenantSlug, setTenantSlug] = useState<string>("")
  const [dynamicMapCenter, setDynamicMapCenter] = useState<{ lat: number; lng: number } | null>(null)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locationsRes, mapCenterRes, tenantRes] = await Promise.all([
          fetch(`/api/locations?tenantId=${tenantId}`),
          fetch(`/api/tenant-map-center?tenantId=${tenantId}`),
          fetch(`/api/tenant?tenantId=${tenantId}`)
        ])

        const locationsData = await locationsRes.json()
        if (locationsData.success && locationsData.locations) {
          setLocations(locationsData.locations)
        }

        const mapCenterData = await mapCenterRes.json()
        if (mapCenterData.success) {
          setMapCenter(mapCenterData.center)
          setMapZoom(mapCenterData.zoom)
          setDynamicMapCenter(mapCenterData.center)
        }

        const tenantData = await tenantRes.json()
        if (tenantData.success && tenantData.tenant) {
          setTenantSlug(tenantData.tenant.slug)
        }
      } catch (error) {
        console.error("[LocationSelector] Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tenantId])

  // Search Mapbox Places
  useEffect(() => {
    if (restrictToCommunity) {
      setMapboxResults([])
      return
    }

    if (!searchQuery.trim() || !mapboxToken) {
      setMapboxResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        // Bias results to current map center
        const centerToUse = dynamicMapCenter || mapCenter
        const proximity = centerToUse ? `&proximity=${centerToUse.lng},${centerToUse.lat}` : ''
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}${proximity}&types=poi,address,place&limit=5`
        )
        const data = await response.json()
        if (data.features) {
          setMapboxResults(data.features)
        }
      } catch (error) {
        console.error('Error searching Mapbox:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, mapboxToken, dynamicMapCenter, mapCenter])

  const filteredCommunityLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations
    const query = searchQuery.toLowerCase()
    return locations.filter(loc =>
      loc.name.toLowerCase().includes(query) ||
      loc.type.toLowerCase().includes(query)
    )
  }, [locations, searchQuery])

  const selectedLocation = locations.find(loc => loc.id === communityLocationId)

  const handleMapLocationClick = (locationId: string) => {
    console.log('[LocationSelector] handleMapLocationClick', locationId)
    const location = locations.find(l => l.id === locationId)
    if (location) {
      console.log('[LocationSelector] Found location, setting type to community')
      onLocationTypeChange('community')
      onCommunityLocationChange(locationId, location.name)
      onCustomLocationNameChange('')
      onCustomLocationChange({ coordinates: null, type: null, path: null })
      setSearchQuery('')
    } else {
      console.warn('[LocationSelector] Location not found for ID:', locationId)
    }
  }

  const handleMapboxSelect = (feature: MapboxFeature) => {
    console.log('[LocationSelector] handleMapboxSelect', feature)
    onLocationTypeChange('custom')
    onCommunityLocationChange('')
    onCustomLocationNameChange(feature.text)
    onCustomLocationChange({
      coordinates: { lat: feature.center[1], lng: feature.center[0] },
      type: 'marker',
      path: null
    })
    setSearchQuery('')
  }

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    if (locationType === 'community') {
      // In community mode, clicking empty space should clear selection
      onCommunityLocationChange('')
      return
    }

    onLocationTypeChange('custom')
    onCommunityLocationChange('')
    onCustomLocationChange({
      coordinates: coords,
      type: 'marker',
      path: null
    })
  }

  const handlePoiClick = (poi: { name: string; address?: string; lat: number; lng: number }) => {
    // When clicking a POI, we want to select it as a "Custom Location" but without a pin marker (maybe?)
    // The user said: "simply highlight that location icon in orange"
    // We can achieve this by setting it as a custom location but maybe with a flag or just standard custom location
    // For now, let's treat it as a custom location but we might need to pass a "isPoi" flag if we want different styling
    // But MapboxViewer customMarker is just a marker.
    // To "highlight icon in orange" without a pin, we might need to use the highlightLocationId if it was a community location,
    // but this is a public POI.
    // MapboxViewer doesn't support highlighting arbitrary POIs yet.
    // For now, let's just set it as a custom location (which drops a pin) as a fallback, 
    // OR we can try to implement the highlight logic.
    // User said: "if selecting a public place on the map, we don't need to show an extra pin but simply highlight that location icon in orange."

    onLocationTypeChange('custom')
    onCommunityLocationChange('')
    onCustomLocationNameChange(poi.name)
    onCustomLocationChange({
      coordinates: { lat: poi.lat, lng: poi.lng },
      type: 'marker', // We still use marker type for data, but maybe we can suppress the visual pin if we had a way
      path: null
    })
    setSearchQuery('')
  }

  const handleClearSelection = () => {
    onCommunityLocationChange('')
    onCustomLocationNameChange('')
    onCustomLocationChange({ coordinates: null, type: null, path: null })
    if (locationType === 'custom') {
      onLocationTypeChange('community')
    }
  }

  const mapCenterToPass = customLocationCoordinates || mapCenter

  return (
    <div className="space-y-6">
      {/* Unified Search */}
      <div className="space-y-2">
        <Label htmlFor="location-search" className="text-sm">
          Search Locations
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            id="location-search"
            placeholder={restrictToCommunity ? "Search community locations..." : "Search community or public places..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              // Auto-switch to community mode on focus if no location type is selected
              // This shows the map immediately when the user starts searching
              if (!locationType || locationType === 'none') {
                onLocationTypeChange('community')
              }
            }}
            className="pl-10"
          />
          {/* Search Results Dropdown */}
          {searchQuery && (filteredCommunityLocations.length > 0 || mapboxResults.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-popover border rounded-lg shadow-lg max-h-80 overflow-y-auto z-20">
              {/* Community Results */}
              {filteredCommunityLocations.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted sticky top-0">
                    Community Locations
                  </div>
                  {filteredCommunityLocations.slice(0, 10).map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleMapLocationClick(location.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{location.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`${locationTypeColors[location.type]} text-xs`}>
                            {locationTypeLabels[location.type] || location.type}
                          </Badge>
                          {location.neighborhood && (
                            <span className="text-xs text-muted-foreground truncate">
                              {location.neighborhood.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Mapbox Results */}
              {mapboxResults.length > 0 && !restrictToCommunity && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted sticky top-0 border-t">
                    Public Places
                  </div>
                  {mapboxResults.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => handleMapboxSelect(feature)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
                    >
                      <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{feature.text}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {feature.place_name}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        {searchQuery && !isSearching && filteredCommunityLocations.length === 0 && mapboxResults.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No locations found
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium block">Location Type</Label>
        <div className="space-y-2">
          {/* Community Location */}
          <div
            onClick={() => {
              console.log('[LocationSelector] Clicked Community Toggle')
              onLocationTypeChange('community')
              setSearchQuery('')
            }}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${locationType === 'community'
              ? 'border-primary bg-background shadow-sm'
              : 'border-border bg-background hover:border-primary/50'
              }`}
          >
            <div className={`h-4 w-4 rounded-full border border-primary flex items-center justify-center ${locationType === 'community' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}>
              {locationType === 'community' && <div className="h-2 w-2 rounded-full bg-current" />}
            </div>
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium text-sm">Community Location</div>
              <div className="text-xs text-muted-foreground">Lots, facilities, etc.</div>
            </div>
          </div>

          {/* Custom Location */}
          <div
            onClick={() => {
              console.log('[LocationSelector] Clicked Custom Toggle')
              onLocationTypeChange('custom')
              setSearchQuery('')
            }}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${locationType === 'custom'
              ? 'border-primary bg-background shadow-sm'
              : 'border-border bg-background hover:border-primary/50'
              }`}
          >
            <div className={`h-4 w-4 rounded-full border border-primary flex items-center justify-center ${locationType === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}>
              {locationType === 'custom' && <div className="h-2 w-2 rounded-full bg-current" />}
            </div>
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium text-sm">Custom Location</div>
              <div className="text-xs text-muted-foreground">Drop a pin anywhere</div>
            </div>
          </div>

          {/* No Location */}
          <div
            onClick={() => {
              console.log('[LocationSelector] Clicked No Location Toggle')
              onLocationTypeChange('none')
              onCommunityLocationChange('')
              onCustomLocationNameChange('')
              onCustomLocationChange({ coordinates: null, type: null, path: null })
              setSearchQuery('')
            }}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${locationType === 'none'
              ? 'border-primary bg-background shadow-sm'
              : 'border-border bg-background hover:border-primary/50'
              }`}
          >
            <div className={`h-4 w-4 rounded-full border border-primary flex items-center justify-center ${locationType === 'none' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}>
              {locationType === 'none' && <div className="h-2 w-2 rounded-full bg-current" />}
            </div>
            <XCircle className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium text-sm">No Location</div>
              <div className="text-xs text-muted-foreground">Not applicable</div>
            </div>
          </div>
        </div>
      </div>

      {/* Map and Selected Location */}
      {(locationType === 'community' || locationType === 'custom') && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Selected Location Preview */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Selected Location</Label>
            {selectedLocation ? (
              <Card className="border-2 border-primary">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{selectedLocation.name}</span>
                      </div>
                      <Badge variant="outline" className={`${locationTypeColors[selectedLocation.type]} text-xs`}>
                        {locationTypeLabels[selectedLocation.type] || selectedLocation.type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleClearSelection}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : customLocationCoordinates ? (
              <Card className="border-2 border-primary">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{customLocationName || 'Custom Location'}</span>
                      </div>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                        Public
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleClearSelection}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-4 text-center">
                  <MapPin className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {locationType === 'community' ? 'Click on the map to select' : 'Drop a pin on the map'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Custom Location Name Input */}
          {locationType === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="custom-name" className="text-sm">
                Location Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="custom-name"
                placeholder="e.g., La Fortuna Waterfall"
                value={customLocationName || ''}
                onChange={(e) => onCustomLocationNameChange(e.target.value)}
              />
            </div>
          )}

          {/* Map */}
          <div className="h-[400px] rounded-lg border overflow-hidden shadow-sm">
            {mapCenter ? (
              <MapboxFullViewer
                locations={locations}
                tenantId={tenantId}
                tenantSlug={tenantSlug}
                checkIns={[]}
                mapCenter={mapCenterToPass}
                mapZoom={customLocationCoordinates ? 16 : mapZoom}
                showControls={false}
                enableSelection={false}
                highlightLocationId={communityLocationId || undefined}
                customMarker={customLocationCoordinates ? {
                  lat: customLocationCoordinates.lat,
                  lng: customLocationCoordinates.lng,
                  label: customLocationName || "Custom Location"
                } : null}
                onLocationClick={(locationId, location) => {
                  // Handle location click from map
                  // MapboxViewer calls this with (locationId, location)
                  handleMapLocationClick(locationId)
                }}
                onMapClick={handleMapClick}
                onPoiClick={handlePoiClick}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted">
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
