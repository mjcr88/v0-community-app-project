import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { MapboxEditorClient } from "@/components/map/MapboxEditorClient"
import { GeoJSONPreviewMap } from "@/components/map/geojson-preview-map"

export default async function CreateLocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { slug } = await params
  const { preview } = await searchParams

  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role, tenant_id, is_tenant_admin")
    .eq("id", user.id)
    .single()

  if (!userData || (!userData.is_tenant_admin && userData.role !== "super_admin" && userData.role !== "tenant_admin")) {
    redirect(`/t/${slug}`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant || (userData.role !== "super_admin" && tenant.id !== userData.tenant_id)) {
    redirect(`/t/${slug}`)
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
          profile_picture_url
        )
      )
    `)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  const { data: lots } = await supabase
    .from("lots")
    .select("id, lot_number, address, neighborhood_id, neighborhoods!inner(name, tenant_id)")
    .eq("neighborhoods.tenant_id", tenant.id)
    .order("lot_number")

  const transformedLots = lots?.map(lot => ({
    id: lot.id,
    lot_number: lot.lot_number,
    address: lot.address,
    neighborhoods: Array.isArray(lot.neighborhoods) ? lot.neighborhoods[0] : lot.neighborhoods
  }))

  const isPreview = preview === "true"

  return (
    <div className="h-screen w-full">
      {isPreview ? (
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Preview GeoJSON Import</h1>
            <p className="text-muted-foreground">Review the imported features and configure location settings</p>
          </div>
          <GeoJSONPreviewMap tenantSlug={slug} tenantId={tenant.id} />
        </div>
      ) : (
        <MapboxEditorClient
          locations={locations || []}
          lots={transformedLots || []}
          tenantId={tenant.id}
          tenantSlug={slug}
          mapCenter={tenant.map_center_coordinates as { lat: number; lng: number } | null}
          mapZoom={tenant.map_default_zoom || 15}
        />
      )}
    </div>
  )
}
