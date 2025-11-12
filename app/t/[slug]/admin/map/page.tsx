import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { LocationsTable } from "@/components/map/locations-table"
import { GeoJSONUploadButton } from "@/components/map/geojson-upload-button"
import { AdminMapClient } from "./admin-map-client"
import { redirect } from "next/navigation"
import { getLocationCounts } from "@/lib/queries/get-locations"
import { MapSettingsDialog } from "./map-settings-dialog"

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

  const counts = await getLocationCounts(tenant.id)

  const { data: locations } = await supabase
    .from("locations")
    .select(`
      *, 
      neighborhoods!locations_neighborhood_id_fkey(name),
      lots!locations_lot_id_fkey(
        id, 
        lot_number,
        users!users_lot_id_fkey(
          id, 
          first_name, 
          last_name, 
          profile_picture_url,
          family_units!users_family_unit_id_fkey(
            id,
            name,
            profile_picture_url,
            description
          )
        )
      )
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
          <MapSettingsDialog
            tenantId={tenant.id}
            currentCenter={tenant.map_center_coordinates as { lat: number; lng: number } | null}
            currentZoom={tenant.map_default_zoom}
          />
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

      {/* Use client component for clickable cards */}
      <AdminMapClient
        counts={{
          facilities: counts.facility || 0,
          lots: counts.lot || 0,
          neighborhoods: counts.neighborhood || 0,
          walkingPaths: counts.walking_path || 0,
          protectionZones: counts.protection_zone || 0,
          easements: counts.easement || 0,
          playgrounds: counts.playground || 0,
          publicStreets: counts.public_street || 0,
          greenAreas: counts.green_area || 0,
          recreationalZones: counts.recreational_zone || 0,
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
