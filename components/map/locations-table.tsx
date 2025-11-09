"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Loader2, Map, Search } from "lucide-react"
import Link from "next/link"
import { deleteLocation } from "@/app/actions/locations"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface LocationsTableProps {
  locations: any[]
  tenantSlug: string
  tenantId: string
  initialTypeFilter?: string
}

export function LocationsTable({ locations, tenantSlug, tenantId, initialTypeFilter }: LocationsTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [typeFilter, setTypeFilter] = useState<string>(initialTypeFilter || "all")
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("all")
  const [nameFilter, setNameFilter] = useState("")
  const [descriptionFilter, setDescriptionFilter] = useState("")
  const [globalSearch, setGlobalSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
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

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleLocations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleLocations.map((l) => l.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} location(s)? This action cannot be undone.`,
    )
    if (!confirmed) return

    setDeleting(true)

    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteLocation(id, tenantId)))

      toast({
        title: "Success",
        description: `Deleted ${selectedIds.size} location(s) successfully!`,
      })

      setSelectedIds(new Set())
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting locations:", error)
      toast({
        title: "Error",
        description: "Error deleting locations: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4" id="locations-table">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">All Locations</h2>
          <p className="text-sm text-muted-foreground">Browse and filter all map locations</p>
        </div>
        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={handleBulkDelete} disabled={deleting}>
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete {selectedIds.size} Selected
          </Button>
        )}
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
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === visibleLocations.length && visibleLocations.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Neighborhood</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
            <TableRow className="bg-muted/50">
              <TableCell />
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
              visibleLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(location.id)}
                      onCheckedChange={() => toggleSelect(location.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{location.name || "—"}</TableCell>
                  <TableCell>{typeLabels[location.type] || location.type}</TableCell>
                  <TableCell>{location.neighborhoods?.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {location.description ? <span className="line-clamp-1">{location.description}</span> : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/t/${tenantSlug}/admin/map/edit?highlightLocation=${location.id}`}>
                          <Map className="h-4 w-4 mr-1" />
                          View on Map
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/t/${tenantSlug}/admin/map/locations/create?editLocationId=${location.id}`}>
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {visibleLocations.length} of {filteredLocations.length} locations
          {filteredLocations.length < locations.length && ` (${locations.length} total)`}
          {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
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
