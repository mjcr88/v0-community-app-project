import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Map } from "lucide-react"
import { redirect } from "next/navigation"

export default async function ResidentCommunityMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const { slug } = await params
  const { type: initialTypeFilter } = await searchParams

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/auth/login`)
  }

  const { data: resident } = await supabase.from("users").select("*").eq("id", user.id).eq("role", "resident").single()

  if (!resident) {
    redirect(`/t/${slug}/auth/login`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", resident.tenant_id).single()

  if (!tenant) {
    return <div>Tenant not found</div>
  }

  const defaultFeatures = { map: true }
  const mergedFeatures = { ...defaultFeatures, ...(tenant?.features || {}) }
  const mapEnabled = mergedFeatures.map === true

  if (!mapEnabled) {
    redirect(`/t/${slug}/dashboard`)
  }

  // Fetch location counts
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

  const { count: neighborhoodsCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "neighborhood")

  const { count: protectionZonesCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "protection_zone")

  const { count: easementsCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "easement")

  const { count: playgroundsCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "playground")

  const { count: publicStreetsCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "public_street")

  const { count: greenAreasCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "green_area")

  const { count: recreationalZonesCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "recreational_zone")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Community Map</h1>
        <p className="text-muted-foreground">Explore locations and facilities in your community</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Interactive Community Map</CardTitle>
              <CardDescription>Map view coming soon</CardDescription>
            </div>
            <Link href={`/t/${slug}/dashboard/map`}>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                <Map className="h-4 w-4" />
                View Full Map
              </button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg overflow-hidden border flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Map components need to be recreated</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilitiesCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Neighborhoods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{neighborhoodsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Walking Paths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pathsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Playgrounds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playgroundsCount || 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
