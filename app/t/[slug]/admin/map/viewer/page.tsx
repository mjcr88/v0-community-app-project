import { createServerClient } from "@/lib/supabase/server"
import { GoogleMapEditor } from "@/components/map/google-map-editor"

export default async function MapViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ locationId?: string; preview?: string }>
}) {
  const { slug } = await params
  const { locationId, preview } = await searchParams
  const supabase = await createServerClient()

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    return <div>Tenant not found</div>
  }

  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  const communityBoundary = tenant.map_boundary_coordinates || null

  const mode = preview === "true" ? "preview" : "view"

  return (
    <div className="h-[100vh] w-full">
      <GoogleMapEditor
        tenantSlug={slug}
        tenantId={tenant.id}
        mode={mode}
        initialLocations={locations || []}
        mapCenter={tenant.map_center_coordinates as { lat: number; lng: number } | null}
        mapZoom={tenant.map_default_zoom || 15}
        communityBoundary={communityBoundary}
        initialHighlightLocationId={locationId}
      />
    </div>
  )
}
