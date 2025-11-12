"use client"

import { useState, useEffect, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, MapPin, XCircle, Loader2, Search, X, ExternalLink } from "lucide-react"
import { GoogleMapViewer } from "@/components/map/google-map-viewer"

export type LocationType = "community" | "custom" | "none"

interface Location {
  id: string
  name: string
  type: string
  coordinates?: { lat: number; lng: number } | null
  boundary_coordinates?: Array<[number, number]> | null
  path_coordinates?: Array<[number, number]> | null
  icon?: string | null
  facility_type?: string | null
}

interface LocationSelectorProps {
  tenantId: string
  locationType: LocationType
  communityLocationId?: string | null
  customLocationName?: string | null
  customLocationCoordinates?: { lat: number; lng: number } | null
  customLocationType?: "pin" | "polygon" | null
  customLocationPath?: Array<{ lat: number; lng: number }> | null
  onLocationTypeChange: (type: LocationType) => void
  onCommunityLocationChange: (locationId: string) => void
  onCustomLocationNameChange: (name: string) => void
  onCustomLocationChange: (data: {
    coordinates?: { lat: number; lng: number } | null
    type?: "pin" | "polygon" | null
    path?: Array<{ lat: number; lng: number }> | null
  }) => void
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
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [highlightedLocationId, setHighlightedLocationId] = useState<string | undefined>(undefined)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [mapZoom, setMapZoom] = useState<number>(14)
  const [tenantSlug, setTenantSlug] = useState<string>("")
  const [mapCenterLoading, setMapCenterLoading] = useState(true)
  const [customDrawingMode, setCustomDrawingMode] = useState<"marker" | "polygon" | null>(
    locationType === "custom" ? "marker" : null,
  )

  const handleCustomLocationDrawing = useCallback(
    (data: {
      coordinates?: { lat: number; lng: number } | null
      type?: "pin" | "polygon" | null
      path?: Array<{ lat: number; lng: number }> | null
    }) => {
      console.log("[v0] Custom location drawn:", data)
      onCustomLocationChange(data)
    },
    [onCustomLocationChange],
  )

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        console.log("[v0] Fetching locations for tenant:", tenantId)
        const response = await fetch(`/api/locations?tenantId=${tenantId}`)
        const data = await response.json()

        console.log("[v0] Locations API response:", data)

        if (data.success && data.locations) {
          console.log("[v0] Total locations received:", data.locations.length)
          setLocations(data.locations)
        }
      } catch (error) {
        console.error("[v0] Error fetching locations:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchMapCenter = async () => {
      try {
        console.log("[v0] Fetching map center for tenant:", tenantId)
        const response = await fetch(`/api/tenant-map-center?tenantId=${tenantId}`)
        const data = await response.json()

        console.log("[v0] Map center API response:", data)

        if (data.success) {
          setMapCenter(data.center)
          setMapZoom(data.zoom)
        }
      } catch (error) {
        console.error("[v0] Error fetching map center:", error)
      } finally {
        setMapCenterLoading(false)
      }
    }

    const fetchTenantSlug = async () => {
      try {
        const response = await fetch(`/api/tenant?tenantId=${tenantId}`)
        const data = await response.json()
        if (data.success && data.tenant) {
          setTenantSlug(data.tenant.slug)
        }
      } catch (error) {
        console.error("[v0] Error fetching tenant slug:", error)
      }
    }

    fetchLocations()
    fetchMapCenter()
    fetchTenantSlug()
  }, [tenantId])

  useEffect(() => {
    if (locationType === "custom" && !customDrawingMode) {
      setCustomDrawingMode("marker")
    } else if (locationType !== "custom") {
      setCustomDrawingMode(null)
    }
  }, [locationType, customDrawingMode])

  useEffect(() => {
    const handlePlaceSelected = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log("[v0] Place selected event received:", customEvent.detail)
      const { name, lat, lng } = customEvent.detail

      onCustomLocationNameChange(name)
      handleCustomLocationDrawing({
        coordinates: { lat, lng },
        type: "pin",
        path: null,
      })
    }

    window.addEventListener("placeSelected", handlePlaceSelected)

    return () => {
      window.removeEventListener("placeSelected", handlePlaceSelected)
    }
  }, [onCustomLocationNameChange, handleCustomLocationDrawing])

  useEffect(() => {
    if (locationType === "custom" && customLocationCoordinates) {
      console.log("[v0] Loading saved custom location:", customLocationCoordinates)
    }
  }, [locationType, customLocationCoordinates])

  const handleMapLocationClick = (locationId: string) => {
    console.log("[v0] Map location clicked, setting highlight:", locationId)
    setHighlightedLocationId(locationId)
  }

  const handleLocationSelect = (location: Location) => {
    console.log("[v0] Location selected:", location.id)
    onCommunityLocationChange(location.id)
    setHighlightedLocationId(undefined)
  }

  const handleClearSelection = () => {
    onCommunityLocationChange("")
    setHighlightedLocationId(undefined)
  }

  const selectedLocation = locations.find((loc) => loc.id === communityLocationId)

  const filteredLocations = (() => {
    if (searchQuery) {
      let filtered = locations.filter((location) => location.name.toLowerCase().includes(searchQuery.toLowerCase()))

      if (communityLocationId) {
        const selected = locations.find((loc) => loc.id === communityLocationId)
        if (selected && !filtered.find((loc) => loc.id === communityLocationId)) {
          filtered = [selected, ...filtered]
        }
      }

      return filtered
    }

    if (highlightedLocationId) {
      const highlighted = locations.find((loc) => loc.id === highlightedLocationId)
      return highlighted ? [highlighted] : []
    }

    return []
  })()

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="space-y-2">
        <Label className="text-base font-semibold">Event Location</Label>
        <p className="text-sm text-muted-foreground">Where will this event take place?</p>
      </div>

      <RadioGroup value={locationType} onValueChange={(value) => onLocationTypeChange(value as LocationType)}>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 rounded-md border p-4">
            <RadioGroupItem value="community" id="location-community" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="location-community" className="font-medium cursor-pointer flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Community Location
              </Label>
              <p className="text-sm text-muted-foreground mt-1">Select an existing facility or location</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 rounded-md border p-4">
            <RadioGroupItem value="custom" id="location-custom" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="location-custom" className="font-medium cursor-pointer flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Custom Location
              </Label>
              <p className="text-sm text-muted-foreground mt-1">Draw a custom pin or area on the map</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 rounded-md border p-4">
            <RadioGroupItem value="none" id="location-none" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="location-none" className="font-medium cursor-pointer flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                No Physical Location
              </Label>
              <p className="text-sm text-muted-foreground mt-1">Virtual event or location not applicable</p>
            </div>
          </div>
        </div>
      </RadioGroup>

      {locationType === "community" && (
        <div className="pl-6 border-l-2 space-y-4">
          {selectedLocation && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{selectedLocation.name}</p>
                    </div>
                    <Badge variant="outline" className={locationTypeColors[selectedLocation.type]}>
                      {locationTypeLabels[selectedLocation.type] || selectedLocation.type}
                    </Badge>
                    {selectedLocation.facility_type && (
                      <p className="text-sm text-muted-foreground">{selectedLocation.facility_type}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading locations...
            </div>
          ) : locations.length > 0 ? (
            <>
              <div className="h-96 rounded-lg overflow-hidden border">
                {!mapCenterLoading && mapCenter ? (
                  <GoogleMapViewer
                    locations={locations}
                    tenantId={tenantId}
                    highlightLocationId={highlightedLocationId}
                    selectedLocationId={communityLocationId || undefined}
                    minimal={true}
                    mapCenter={mapCenter}
                    mapZoom={mapZoom}
                    onLocationClick={handleMapLocationClick}
                    showInfoCard={false}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLocations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            <div className="space-y-2">
                              <MapPin className="h-8 w-8 mx-auto opacity-30" />
                              <p>Click a location on the map or search above</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLocations.map((location) => (
                          <TableRow
                            key={location.id}
                            className={`cursor-pointer ${communityLocationId === location.id ? "bg-muted" : ""}`}
                            onClick={() => setHighlightedLocationId(location.id)}
                          >
                            <TableCell className="font-medium">{location.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={locationTypeColors[location.type]}>
                                {locationTypeLabels[location.type] || location.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {tenantSlug && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.open(
                                        `/t/${tenantSlug}/dashboard/locations/${location.id}`,
                                        "_blank",
                                        "noopener,noreferrer",
                                      )
                                    }}
                                    title="View location details"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                                {communityLocationId === location.id ? (
                                  <Badge>Selected</Badge>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleLocationSelect(location)
                                    }}
                                  >
                                    Select
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No community locations available. Contact your admin to add locations.
            </p>
          )}
        </div>
      )}

      {locationType === "custom" && (
        <div className="pl-6 border-l-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-location-name">
              Location Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="custom-location-name"
              placeholder="e.g., Back Patio, La Fortuna Waterfall, Arenal Restaurant"
              value={customLocationName || ""}
              onChange={(e) => onCustomLocationNameChange(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Drop a pin anywhere or click a public location on the map to auto-fill
            </p>
          </div>

          <div className="h-96 rounded-lg overflow-hidden border">
            {!mapCenterLoading && mapCenter ? (
              <GoogleMapViewer
                locations={locations}
                tenantId={tenantId}
                mapCenter={mapCenter}
                mapZoom={mapZoom}
                minimal={true}
                showInfoCard={false}
                drawingMode={customDrawingMode}
                onDrawingModeChange={setCustomDrawingMode}
                onDrawingComplete={handleCustomLocationDrawing}
                drawnCoordinates={customLocationCoordinates}
                drawnPath={customLocationPath}
                drawnType={customLocationType}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
