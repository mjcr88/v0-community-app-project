"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Map } from "lucide-react"
import Link from "next/link"

interface ResidentLocationsTableProps {
  locations: any[]
  tenantSlug: string
  initialTypeFilter?: string
}

export function ResidentLocationsTable({ locations, tenantSlug, initialTypeFilter }: ResidentLocationsTableProps) {
  const [typeFilter, setTypeFilter] = useState<string>(initialTypeFilter || "all")
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [displayLimit, setDisplayLimit] = useState(10)

  useEffect(() => {
    const handleFilterEvent = (event: CustomEvent) => {
      if (event.detail?.type) {
        setTypeFilter(event.detail.type)
      }
    }

    window.addEventListener("filterLocations", handleFilterEvent as EventListener)
    return () => window.removeEventListener("filterLocations", handleFilterEvent as EventListener)
  }, [])

  const neighborhoods = Array.from(new Set(locations.map((l) => l.neighborhoods?.name).filter(Boolean)))

  const filteredLocations = locations.filter((location) => {
    const matchesType = typeFilter === "all" || location.type === typeFilter
    const matchesNeighborhood = neighborhoodFilter === "all" || location.neighborhoods?.name === neighborhoodFilter
    const matchesSearch =
      !searchQuery ||
      location.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.description?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesType && matchesNeighborhood && matchesSearch
  })

  const visibleLocations = filteredLocations.slice(0, displayLimit)

  const typeLabels: Record<string, string> = {
    facility: "Facility",
    lot: "Lot",
    walking_path: "Walking Path",
    neighborhood: "Neighborhood",
    protection_zone: "Protection Zone",
    easement: "Easement",
    playground: "Playground",
    public_street: "Public Street",
    green_area: "Green Area",
    recreational_zone: "Recreational Zone",
  }

  return (
    <Card id="locations-table">
      <CardHeader>
        <CardTitle>All Locations</CardTitle>
        <CardDescription>Browse and search all community locations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center flex-wrap">
          <Input
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="facility">Facilities</SelectItem>
              <SelectItem value="lot">Lots</SelectItem>
              <SelectItem value="walking_path">Walking Paths</SelectItem>
              <SelectItem value="neighborhood">Neighborhoods</SelectItem>
              <SelectItem value="protection_zone">Protection Zones</SelectItem>
              <SelectItem value="easement">Easements</SelectItem>
              <SelectItem value="playground">Playgrounds</SelectItem>
              <SelectItem value="public_street">Public Streets</SelectItem>
              <SelectItem value="green_area">Green Areas</SelectItem>
              <SelectItem value="recreational_zone">Recreational Zones</SelectItem>
            </SelectContent>
          </Select>
          {neighborhoods.length > 0 && (
            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by neighborhood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Neighborhoods</SelectItem>
                {neighborhoods.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-sm font-medium">Name</th>
                <th className="p-3 text-left text-sm font-medium">Type</th>
                <th className="p-3 text-left text-sm font-medium">Neighborhood</th>
                <th className="p-3 text-left text-sm font-medium">Description</th>
                <th className="p-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleLocations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No locations found
                  </td>
                </tr>
              ) : (
                visibleLocations.map((location) => (
                  <tr key={location.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-sm font-medium">{location.name || "—"}</td>
                    <td className="p-3 text-sm">{typeLabels[location.type] || location.type}</td>
                    <td className="p-3 text-sm">{location.neighborhoods?.name || "—"}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {location.description ? <span className="line-clamp-1">{location.description}</span> : "—"}
                    </td>
                    <td className="p-3 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/t/${tenantSlug}/dashboard/map?highlightLocation=${location.id}`}>
                          <Map className="h-4 w-4 mr-1" />
                          View on Map
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {visibleLocations.length} of {filteredLocations.length} locations
            {filteredLocations.length < locations.length && ` (${locations.length} total)`}
          </p>
          {visibleLocations.length < filteredLocations.length && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDisplayLimit(displayLimit + 10)}>
                Load 10 More
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDisplayLimit(filteredLocations.length)}>
                Show All ({filteredLocations.length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
