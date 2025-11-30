import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { GeoJSONUploadButton } from "@/components/map/geojson-upload-button"
import { redirect } from "next/navigation"
import { MapSettingsDialog } from "./map-settings-dialog"
import { AdminMapWrapper } from "./viewer/admin-map-wrapper"
import { getCheckIns } from "@/lib/data/check-ins"

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

  const checkIns = await getCheckIns(tenant.id)

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
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
          <GeoJSONUploadButton tenantId={tenant.id} tenantSlug={slug} />
          <Button asChild>
            <Link href={`/t/${slug}/admin/map/locations/create`}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden shadow-sm">
        <AdminMapWrapper
          locations={locations || []}
          tenantId={tenant.id}
          tenantSlug={slug}
          checkIns={checkIns}
        />
      </div>
    </div>
  )
}
