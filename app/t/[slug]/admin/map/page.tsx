import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function MapManagementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    return <div>Tenant not found</div>
  }

  const { count: facilitiesCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "facility")

  const { count: lotsCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "lot")

  const { count: pathsCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "walking_path")

  const { data: locations } = await supabase
    .from("locations")
    .select("*, neighborhoods(name)")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community Map</h1>
          <p className="text-muted-foreground">Manage locations, boundaries, and walking paths</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/t/${slug}/admin/map/viewer`}>View Map</Link>
          </Button>
          <Button asChild>
            <Link href={`/t/${slug}/admin/map/locations/create`}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Community Boundary</CardTitle>
          <CardDescription>Define the boundary of your community to focus the map view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {tenant.map_boundary_coordinates
                ? "Boundary is set. Click below to edit."
                : "No boundary set yet. Click below to create one."}
            </p>
            <Button asChild variant="outline">
              <Link href={`/t/${slug}/admin/map/boundary`}>
                {tenant.map_boundary_coordinates ? "Edit Boundary" : "Create Boundary"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Facilities</CardTitle>
            <CardDescription>Community amenities and points of interest</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{facilitiesCount || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lot Boundaries</CardTitle>
            <CardDescription>Property boundaries and lot markers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lotsCount || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Walking Paths</CardTitle>
            <CardDescription>Trails and pathways through the community</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pathsCount || 0}</p>
          </CardContent>
        </Card>
      </div>

      <LocationsTable locations={locations || []} tenantSlug={slug} />
    </div>
  )
}

function LocationsTable({ locations, tenantSlug }: { locations: any[]; tenantSlug: string }) {
  "use client"

  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  const [neighborhoodFilter, setNeighborhoodFilter] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState("")

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

import React from "react"
