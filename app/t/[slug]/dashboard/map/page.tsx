import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getLocations } from "@/lib/data/locations"
import { ResidentMapClient } from "@/components/map/resident-map-client"

export default async function ResidentMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ highlightLocation?: string }>
}) {
  const { slug } = await params
  const { highlightLocation } = await searchParams
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
  const defaultFeatures = { map: true }
  const mergedFeatures = { ...defaultFeatures, ...(tenant?.features || {}) }
  const mapEnabled = mergedFeatures.map === true

  if (!mapEnabled) {
    redirect(`/t/${slug}/dashboard`)
  }

  const locations = await getLocations(tenant.id, {
    enrichWithNeighborhood: true,
    enrichWithLot: true,
    enrichWithResidents: true,
    enrichWithFamilies: true,
    enrichWithPets: true,
  })

  const boundaryLocation = locations.find(
    (loc) =>
      loc.type === "boundary" &&
      (loc.name.toLowerCase().includes("boundary") || loc.name.toLowerCase().includes("community")),
  )

  let calculatedCenter = tenant.map_center_coordinates
    ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
    : null

  if (!calculatedCenter) {
    const boundaryLocations = locations.filter((loc) => loc.type === "boundary" && loc.boundary_coordinates)
    if (boundaryLocations.length > 0) {
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
      }
    }
  }

  let calculatedZoom = 11 // Start with wider default
  if (boundaryLocation?.boundary_coordinates && boundaryLocation.boundary_coordinates.length > 0) {
    const lats = boundaryLocation.boundary_coordinates.map((c) => c[0])
    const lngs = boundaryLocation.boundary_coordinates.map((c) => c[1])
    const latDiff = Math.max(...lats) - Math.min(...lats)
    const lngDiff = Math.max(...lngs) - Math.min(...lngs)
    const maxDiff = Math.max(latDiff, lngDiff)

    if (maxDiff > 0.02)
      calculatedZoom = 10 // Very large community
    else if (maxDiff > 0.01)
      calculatedZoom = 11 // Large community
    else if (maxDiff > 0.005)
      calculatedZoom = 12 // Medium community
    else calculatedZoom = 13 // Small community
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <ResidentMapClient
        locations={locations}
        tenantId={tenant.id}
        tenantSlug={slug}
        mapCenter={calculatedCenter}
        mapZoom={calculatedZoom}
      />
    </div>
  )
}
