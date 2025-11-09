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

  console.log("[v0] ResidentMapPage - Starting, slug:", slug, "highlightLot:", highlightLot)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] ResidentMapPage - Auth user:", user?.id)

  if (!user) {
    console.log("[v0] ResidentMapPage - No user, redirecting to login")
    redirect(`/t/${slug}/login`)
  }

  // Get resident and tenant
  const { data: resident } = await supabase
    .from("users")
    .select("*, tenant_id")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  console.log("[v0] ResidentMapPage - Resident data:", resident?.id)

  if (!resident) {
    console.log("[v0] ResidentMapPage - No resident found, redirecting to dashboard")
    redirect(`/t/${slug}/dashboard`)
  }

  // Get tenant for map configuration
  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", resident.tenant_id).single()

  console.log("[v0] ResidentMapPage - Tenant data:", tenant?.id)

  if (!tenant) {
    console.log("[v0] ResidentMapPage - No tenant found, redirecting to dashboard")
    redirect(`/t/${slug}/dashboard`)
  }

  // Check if maps feature is enabled
  const defaultFeatures = { map: true }
  const mergedFeatures = { ...defaultFeatures, ...(tenant?.features || {}) }
  const mapEnabled = mergedFeatures.map === true

  console.log("[v0] ResidentMapPage - Map enabled:", mapEnabled)

  if (!mapEnabled) {
    console.log("[v0] ResidentMapPage - Map not enabled, redirecting to dashboard")
    redirect(`/t/${slug}/dashboard`)
  }

  // Get all locations for the tenant
  const { data: locations } = await supabase.from("locations").select("*").eq("tenant_id", tenant.id)

  console.log("[v0] ResidentMapPage - Locations count:", locations?.length)

  // Find highlighted location if highlightLot is provided
  let highlightLocationId: string | undefined
  if (highlightLot) {
    const lotLocation = locations?.find((loc) => loc.lot_id === highlightLot && loc.type === "lot")
    if (lotLocation) {
      highlightLocationId = lotLocation.id
      console.log("[v0] ResidentMapPage - Highlighting lot:", lotLocation.name, lotLocation.id)
    }
  }

  const mapCenter = tenant.map_center_coordinates
    ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
    : null

  console.log("[v0] ResidentMapPage - Rendering map viewer")

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
