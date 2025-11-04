"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface LocationsTableProps {
  locations: any[]
  tenantSlug: string
}

export function LocationsTable({ locations, tenantSlug }: LocationsTableProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Locations</CardTitle>
        <CardDescription>Browse and filter all map locations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
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
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No locations found
                  </td>
                </tr>
              ) : (
                filteredLocations.map((location) => (
                  <tr key={location.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-sm font-medium">{location.name || "—"}</td>
                    <td className="p-3 text-sm">{typeLabels[location.type] || location.type}</td>
                    <td className="p-3 text-sm">{location.neighborhoods?.name || "—"}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {location.description ? <span className="line-clamp-1">{location.description}</span> : "—"}
                    </td>
                    <td className="p-3 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/t/${tenantSlug}/admin/map/locations/create`}>Edit</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {filteredLocations.length} of {locations.length} locations
        </p>
      </CardContent>
    </Card>
  )
}
