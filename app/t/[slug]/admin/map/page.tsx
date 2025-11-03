import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function MapManagementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    return <div>Tenant not found</div>
  }

  // Get location counts
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
          <CardTitle>Map Preview</CardTitle>
          <CardDescription>Quick view of your community map</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg overflow-hidden border">
            <iframe src={`/t/${slug}/admin/map/viewer`} className="w-full h-full" title="Map Preview" />
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
            <div className="space-y-2">
              <p className="text-3xl font-bold">{facilitiesCount || 0}</p>
              <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                <Link href={`/t/${slug}/admin/map/locations?type=facility`}>Manage Facilities</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lot Boundaries</CardTitle>
            <CardDescription>Property boundaries and lot markers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold">{lotsCount || 0}</p>
              <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                <Link href={`/t/${slug}/admin/map/locations?type=lot`}>Manage Lots</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Walking Paths</CardTitle>
            <CardDescription>Trails and pathways through the community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold">{pathsCount || 0}</p>
              <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                <Link href={`/t/${slug}/admin/map/locations?type=walking_path`}>Manage Paths</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Map Configuration</CardTitle>
          <CardDescription>Set default map center and zoom level for your community</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={`/t/${slug}/admin/map/settings`}>Configure Map Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
