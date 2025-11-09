import { createClient } from "@/lib/supabase/server"
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

  let calculatedCenter = tenant.map_center_coordinates
    ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
    : null

  if (!calculatedCenter) {
    const boundaryLocations = locations?.filter((loc) => loc.type === "boundary" && loc.boundary_coordinates)
    if (boundaryLocations && boundaryLocations.length > 0) {
      const allCoords: Array<[number, number]> = []
      boundaryLocations.forEach((loc) => {
        if (loc.boundary_coordinates) {
          allCoords.push(...loc.boundary_coordinates)
        }
      })

      if (allCoords.length > 0) {
        const lats = allCoords.map((c) => c[0])
        const lngs = allCoords.map((c) => c[1])
        const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length
        const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
        calculatedCenter = { lat: centerLat, lng: centerLng }
        console.log("[v0] ResidentMapPage - Calculated center from boundaries:", calculatedCenter)
      }
    }
  }

  // Find highlighted location if highlightLot is provided
  let highlightLocationId: string | undefined
  if (highlightLot) {
    const lotLocation = locations?.find((loc) => loc.lot_id === highlightLot && loc.type === "lot")
    if (lotLocation) {
      highlightLocationId = lotLocation.id
      console.log("[v0] ResidentMapPage - Highlighting lot:", lotLocation.name, lotLocation.id)
    }
  }

  console.log("[v0] ResidentMapPage - Rendering map viewer")

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Community Map</h1>
      <p className="text-muted-foreground">Map view coming soon. Map components need to be recreated.</p>
    </div>
  )
}
