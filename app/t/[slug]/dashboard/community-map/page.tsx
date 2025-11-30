import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getLocations, getLocationCounts } from "@/lib/data/locations"
import { getCheckIns } from "@/lib/data/check-ins"
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

  // Fetch active check-ins with RSVP data
  const rawCheckIns = await getCheckIns(tenant.id, {
    activeOnly: true,
    enrichWithRsvp: true,
    enrichWithCreator: true,
    enrichWithLocation: true,
  })

  // Calculate centroid for locations with path_coordinates but no coordinates
  const processedLocations = locations.map((loc: any) => {
    // If location has coordinates, use them
    if (loc.coordinates) {
      return loc
    }

    // If location has path_coordinates, calculate center point
    if (loc.path_coordinates && Array.isArray(loc.path_coordinates) && loc.path_coordinates.length > 0) {
      try {
        // Calculate centroid from path
        const lats = loc.path_coordinates.map((coord: [number, number]) => coord[0])
        const lngs = loc.path_coordinates.map((coord: [number, number]) => coord[1])
        const centroid = {
          lat: lats.reduce((sum: number, lat: number) => sum + lat, 0) / lats.length,
          lng: lngs.reduce((sum: number, lng: number) => sum + lng, 0) / lngs.length,
        }

        return {
          ...loc,
          coordinates: centroid, // Add calculated centroid as coordinates
        }
      } catch (e) {
        console.error("[Server] Failed to calculate centroid:", e)
        return loc
      }
    }

    return loc
  })

  // Build check-ins with joined data using PROCESSED locations (for coordinates)
  const checkIns =
    rawCheckIns?.map((checkIn: any) => {
      // Use the processed location to ensure we have the calculated centroid
      const location = processedLocations.find((l) => l.id === checkIn.location_id) || checkIn.location

      // Calculate expires_at if missing (needed for client interface)
      let expires_at = checkIn.expires_at
      if (!expires_at && checkIn.start_time && checkIn.duration_minutes) {
        const startTime = new Date(checkIn.start_time).getTime()
        const durationMs = checkIn.duration_minutes * 60 * 1000
        expires_at = new Date(startTime + durationMs).toISOString()
      }

      return {
        ...checkIn,
        location,
        resident: checkIn.creator, // Map creator to resident for client compatibility
        expires_at: expires_at || new Date().toISOString(), // Fallback
      }
    }) || []

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

  let calculatedZoom = 11 // Start with wider default (was 12)
  if (boundaryLocation?.boundary_coordinates && boundaryLocation.boundary_coordinates.length > 0) {
    const lats = boundaryLocation.boundary_coordinates.map((c) => c[0])
    const lngs = boundaryLocation.boundary_coordinates.map((c) => c[1])
    const latDiff = Math.max(...lats) - Math.min(...lats)
    const lngDiff = Math.max(...lngs) - Math.min(...lngs)
    const maxDiff = Math.max(latDiff, lngDiff)

    if (maxDiff > 0.02) calculatedZoom = 10 // Very large community
    else if (maxDiff > 0.01) calculatedZoom = 11 // Large community
    else if (maxDiff > 0.005) calculatedZoom = 12 // Medium community
    else calculatedZoom = 13 // Small community
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
      locations={processedLocations}
      checkIns={checkIns}
      mapCenter={calculatedCenter}
      boundaryLocationId={boundaryLocation?.id}
      mapZoom={13}
      initialTypeFilter={initialTypeFilter}
    />
  )
}
