import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { LocationsTable } from "@/components/map/locations-table"
import { GeoJSONUploadButton } from "@/components/map/geojson-upload-button"
import { AdminMapClient } from "./admin-map-client"
import { redirect } from "next/navigation"

export default async function MapManagementPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const { slug } = await params
  const { type: initialTypeFilter } = await searchParams

  const supabase = await createServerClient()

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    return <div>Tenant not found</div>
  }

  const features = tenant.features as { map?: boolean } | null
  if (features?.map === false) {
    redirect(`/t/${slug}/admin/dashboard`)
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

  const { data: locations } = await supabase
    .from("locations")
    .select(`
      *, 
      neighborhoods!locations_neighborhood_id_fkey(name),
      lots!locations_lot_id_fkey(id, lot_number),
      users!users_lot_id_fkey(id, first_name, last_name, profile_picture_url)
    `)
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
            <Link href={`/t/${slug}/admin/map/edit`}>View Map</Link>
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

      {/* Use client component for clickable cards */}
      <AdminMapClient
        counts={{
          facilities: facilitiesCount || 0,
          lots: lotsCount || 0,
          neighborhoods: neighborhoodsCount || 0,
          walkingPaths: pathsCount || 0,
          protectionZones: protectionZonesCount || 0,
          easements: easementsCount || 0,
          playgrounds: playgroundsCount || 0,
          publicStreets: publicStreetsCount || 0,
          greenAreas: greenAreasCount || 0,
          recreationalZones: recreationalZonesCount || 0,
        }}
      />

      <LocationsTable
        locations={locations || []}
        tenantSlug={slug}
        tenantId={tenant.id}
        initialTypeFilter={initialTypeFilter}
      />
    </div>
  )
}
