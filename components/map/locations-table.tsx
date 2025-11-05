"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Loader2, Map } from "lucide-react"
import Link from "next/link"
import { deleteLocation } from "@/app/actions/locations"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface LocationsTableProps {
  locations: any[]
  tenantSlug: string
  tenantId: string
}

export function LocationsTable({ locations, tenantSlug, tenantId }: LocationsTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  console.log("[v0] LocationsTable received locations:", locations.length)

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

  const typeLabels: Record<string, string> = {
    facility: "Facility",
    lot: "Lot",
    walking_path: "Walking Path",
    neighborhood: "Neighborhood",
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLocations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredLocations.map((l) => l.id)))
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

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)
    if (!confirmed) return

    setDeleting(true)

    try {
      await deleteLocation(id, tenantId)

      toast({
        title: "Success",
        description: "Location deleted successfully!",
      })

      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting location:", error)
      toast({
        title: "Error",
        description: "Error deleting location: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Locations</CardTitle>
        <CardDescription>Browse and filter all map locations</CardDescription>
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
          {selectedIds.size > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete {selectedIds.size} Selected
            </Button>
          )}
        </div>

        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left">
                  <Checkbox
                    checked={selectedIds.size === filteredLocations.length && filteredLocations.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-3 text-left text-sm font-medium">Name</th>
                <th className="p-3 text-left text-sm font-medium">Type</th>
                <th className="p-3 text-left text-sm font-medium">Neighborhood</th>
                <th className="p-3 text-left text-sm font-medium">Description</th>
                <th className="p-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No locations found
                  </td>
                </tr>
              ) : (
                filteredLocations.map((location) => (
                  <tr key={location.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <Checkbox
                        checked={selectedIds.has(location.id)}
                        onCheckedChange={() => toggleSelect(location.id)}
                      />
                    </td>
                    <td className="p-3 text-sm font-medium">{location.name || "—"}</td>
                    <td className="p-3 text-sm">{typeLabels[location.type] || location.type}</td>
                    <td className="p-3 text-sm">{location.neighborhoods?.name || "—"}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {location.description ? <span className="line-clamp-1">{location.description}</span> : "—"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/t/${tenantSlug}/admin/map/viewer?locationId=${location.id}`}>
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {filteredLocations.length} of {locations.length} locations
          {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
        </p>
      </CardContent>
    </Card>
  )
}
