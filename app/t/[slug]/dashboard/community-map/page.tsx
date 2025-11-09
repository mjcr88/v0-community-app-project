import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getLocations, getLocationCounts } from "@/lib/queries/get-locations"
import { CommunityMapClient } from "./community-map-client"

export default async function ResidentCommunityMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const { slug } = await params
  const { type: initialTypeFilter } = await searchParams

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: resident } = await supabase.from("users").select("*").eq("id", user.id).eq("role", "resident").single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", resident.tenant_id).single()

  if (!tenant) {
    return <div>Tenant not found</div>
  }

  const defaultFeatures = { map: true }
  const mergedFeatures = { ...defaultFeatures, ...(tenant?.features || {}) }
  const mapEnabled = mergedFeatures.map === true

  if (!mapEnabled) {
    redirect(`/t/${slug}/dashboard`)
  }

  const counts = await getLocationCounts(tenant.id)
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

  let calculatedZoom = 12
  if (boundaryLocation?.boundary_coordinates && boundaryLocation.boundary_coordinates.length > 0) {
    const lats = boundaryLocation.boundary_coordinates.map((c) => c[0])
    const lngs = boundaryLocation.boundary_coordinates.map((c) => c[1])
    const latDiff = Math.max(...lats) - Math.min(...lats)
    const lngDiff = Math.max(...lngs) - Math.min(...lngs)
    const maxDiff = Math.max(latDiff, lngDiff)

    // Lower zoom for wider view to show entire boundary
    if (maxDiff > 0.01) calculatedZoom = 12
    else if (maxDiff > 0.005) calculatedZoom = 13
    else calculatedZoom = 14
  }

  return (
    <CommunityMapClient
      slug={slug}
      tenantId={tenant.id}
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
      locations={locations}
      mapCenter={calculatedCenter}
      boundaryLocationId={boundaryLocation?.id}
      mapZoom={calculatedZoom}
      initialTypeFilter={initialTypeFilter}
    />
  )
}
