import { createClient } from "@/lib/supabase/server"
import { GoogleMapViewer } from "@/components/map/google-map-viewer"
import { redirect } from "next/navigation"

export default async function ResidentMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ highlightLot?: string }>
}) {
  const { slug } = await params
  const { highlightLot } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  // Get resident and tenant
  const { data: resident } = await supabase
    .from("users")
    .select("*, tenant_id")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  if (!resident) {
    redirect(`/t/${slug}/dashboard`)
  }

  // Get tenant for map configuration
  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", resident.tenant_id).single()

  if (!tenant) {
    redirect(`/t/${slug}/dashboard`)
  }

  // Check if maps feature is enabled
  const features = (tenant.features as { map?: boolean }) || {}
  if (!features.map) {
    redirect(`/t/${slug}/dashboard`)
  }

  // Get all locations for the tenant
  const { data: locations } = await supabase.from("locations").select("*").eq("tenant_id", tenant.id)

  // Find highlighted location if highlightLot is provided
  let highlightLocationId: string | undefined
  if (highlightLot) {
    const lotLocation = locations?.find((loc) => loc.lot_id === highlightLot && loc.type === "lot")
    if (lotLocation) {
      highlightLocationId = lotLocation.id
    }
  }

  const mapCenter = tenant.map_center_coordinates
    ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
    : null

  return (
    <div className="h-[calc(100vh-8rem)]">
      <GoogleMapViewer
        tenantSlug={slug}
        initialLocations={locations || []}
        mapCenter={mapCenter}
        mapZoom={tenant.map_default_zoom || 15}
        isAdmin={false}
        highlightLocationId={highlightLocationId}
      />
    </div>
  )
}
