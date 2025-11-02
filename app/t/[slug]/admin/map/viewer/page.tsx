import { createServerClient } from "@/lib/supabase/server"
import { MapViewer } from "@/components/map/map-viewer"

export default async function MapViewerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    return <div>Tenant not found</div>
  }

  // Get all locations for this tenant
  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  return (
    <div className="h-[calc(100vh-4rem)]">
      <MapViewer
        tenantSlug={slug}
        initialLocations={locations || []}
        mapCenter={tenant.map_center_coordinates as { lat: number; lng: number } | null}
        mapZoom={tenant.map_default_zoom || 15}
        isAdmin={true}
      />
    </div>
  )
}
