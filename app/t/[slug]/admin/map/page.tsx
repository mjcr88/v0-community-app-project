import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { LocationsTable } from "@/components/map/locations-table"
import { GeoJSONUploadButton } from "@/components/map/geojson-upload-button"

export default async function MapManagementPage({ params }: { params: Promise<{ slug: string }> }) {
  console.log("[v0] Map page rendering started")
  const { slug } = await params
  console.log("[v0] Slug:", slug)

  const supabase = await createServerClient()

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()
  console.log("[v0] Tenant:", tenant?.id)

  if (!tenant) {
    console.log("[v0] Tenant not found")
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

  const { data: locations, error: locationsError } = await supabase
    .from("locations")
    .select("*, neighborhoods!locations_neighborhood_id_fkey(name)")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  console.log("[v0] Locations query result:", { count: locations?.length, error: locationsError })
  console.log("[v0] Map page rendering complete")

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
          <GeoJSONUploadButton tenantId={tenant.id} tenantSlug={slug} />
          <Button asChild>
            <Link href={`/t/${slug}/admin/map/locations/create`}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Link>
          </Button>
        </div>
      </div>

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

      <LocationsTable locations={locations || []} tenantSlug={slug} tenantId={tenant.id} />
    </div>
  )
}
