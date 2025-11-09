"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Map, Search } from "lucide-react"
import Link from "next/link"

interface ResidentLocationsTableProps {
  locations: any[]
  tenantSlug: string
  initialTypeFilter?: string
}

export function ResidentLocationsTable({ locations, tenantSlug, initialTypeFilter }: ResidentLocationsTableProps) {
  const [typeFilter, setTypeFilter] = useState<string>(initialTypeFilter || "all")
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("all")
  const [nameFilter, setNameFilter] = useState("")
  const [descriptionFilter, setDescriptionFilter] = useState("")
  const [globalSearch, setGlobalSearch] = useState("")
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

  const neighborhoods = useMemo(
    () => Array.from(new Set(locations.map((l) => l.neighborhoods?.name).filter(Boolean))),
    [locations],
  )

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

  const getFamilyUnit = (location: any) => {
    if (!location.lots?.users || location.lots.users.length === 0) return null

    // Get all unique family units from users
    const familyUnits = location.lots.users
      .map((user: any) => user.family_units)
      .filter((family: any) => family != null)

    // Return the first family unit if any exist
    return familyUnits.length > 0 ? familyUnits[0] : null
  }

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      // Global search
      if (globalSearch) {
        const searchLower = globalSearch.toLowerCase()
        const matchesGlobal =
          location.name?.toLowerCase().includes(searchLower) ||
          location.description?.toLowerCase().includes(searchLower) ||
          typeLabels[location.type]?.toLowerCase().includes(searchLower) ||
          location.neighborhoods?.name?.toLowerCase().includes(searchLower)

        if (!matchesGlobal) return false
      }

      // Column filters
      const matchesType = typeFilter === "all" || location.type === typeFilter
      const matchesNeighborhood = neighborhoodFilter === "all" || location.neighborhoods?.name === neighborhoodFilter
      const matchesName = !nameFilter || location.name?.toLowerCase().includes(nameFilter.toLowerCase())
      const matchesDescription =
        !descriptionFilter || location.description?.toLowerCase().includes(descriptionFilter.toLowerCase())

      return matchesType && matchesNeighborhood && matchesName && matchesDescription
    })
  }, [locations, globalSearch, typeFilter, neighborhoodFilter, nameFilter, descriptionFilter])

  const visibleLocations = filteredLocations.slice(0, displayLimit)

  useEffect(() => {
    const sampleLocation = locations.find((l) => l.lots?.lot_number === "D-001")
    if (sampleLocation) {
      console.log("[v0] Sample location D-001 data:", {
        name: sampleLocation.name,
        lotNumber: sampleLocation.lots?.lot_number,
        lotsObject: sampleLocation.lots,
        hasUsers: !!sampleLocation.lots?.users,
        usersCount: sampleLocation.lots?.users?.length,
        users: sampleLocation.lots?.users,
      })
    }
  }, [locations])

  return (
    <div className="space-y-4" id="locations-table">
      <div>
        <h2 className="text-xl font-semibold">All Locations</h2>
        <p className="text-sm text-muted-foreground">Browse and search all community locations</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, type, neighborhood, or description..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Neighborhood</TableHead>
              <TableHead className="font-semibold">Family/Residents</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
            <TableRow className="bg-muted/50">
              <TableCell>
                <Input
                  placeholder="Filter name..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
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
              </TableCell>
              <TableCell>
                <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {neighborhoods.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell />
              <TableCell>
                <Input
                  placeholder="Filter description..."
                  value={descriptionFilter}
                  onChange={(e) => setDescriptionFilter(e.target.value)}
                  className="h-8"
                />
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No locations found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              visibleLocations.map((location) => {
                const familyUnit = getFamilyUnit(location)
                const residentCount = location.lots?.users?.length || 0

                return (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name || "—"}</TableCell>
                    <TableCell>{typeLabels[location.type] || location.type}</TableCell>
                    <TableCell>{location.neighborhoods?.name || "—"}</TableCell>
                    <TableCell>
                      {familyUnit ? (
                        <Link
                          href={`/t/${tenantSlug}/dashboard/families/${familyUnit.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {familyUnit.name} ({residentCount})
                        </Link>
                      ) : residentCount > 0 ? (
                        <span className="text-sm text-muted-foreground">{residentCount} resident(s)</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {location.description ? <span className="line-clamp-1">{location.description}</span> : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/t/${tenantSlug}/dashboard/map?highlightLocation=${location.id}`}>
                          <Map className="h-4 w-4 mr-1" />
                          View on Map
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
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
    </div>
  )
}
