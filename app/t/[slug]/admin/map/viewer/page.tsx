import { createServerClient } from "@/lib/supabase/server"
import { GoogleMapViewer } from "@/components/map/google-map-viewer"

export default async function MapViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ locationId?: string }>
}) {
  const { slug } = await params
  const { locationId } = await searchParams
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

  const communityBoundary = tenant.map_boundary_coordinates || null

  console.log("[v0] Viewer page - Community boundary from DB:", communityBoundary)
  console.log("[v0] Viewer page - locationId from URL:", locationId)

  return (
    <div className="h-[100vh] w-full">
      <GoogleMapViewer
        tenantSlug={slug}
        initialLocations={locations || []}
        mapCenter={tenant.map_center_coordinates as { lat: number; lng: number } | null}
        mapZoom={tenant.map_default_zoom || 15}
        isAdmin={true}
        communityBoundary={communityBoundary}
        highlightLocationId={locationId}
      />
    </div>
  )
}
