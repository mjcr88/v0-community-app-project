import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FullMapClient } from "./full-map-client"

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

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  console.log("[v0] ResidentMapPage - Auth user:", user.id)

  const { data: resident } = await supabase
    .from("users")
    .select("*, tenant_id")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  if (!resident) {
    redirect(`/t/${slug}/dashboard`)
  }

  console.log("[v0] ResidentMapPage - Resident data:", resident.id)

  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", resident.tenant_id).single()

  if (!tenant) {
    redirect(`/t/${slug}/dashboard`)
  }

  console.log("[v0] ResidentMapPage - Tenant data:", tenant.id)

  const defaultFeatures = { map: true }
  const mergedFeatures = { ...defaultFeatures, ...(tenant?.features || {}) }
  const mapEnabled = mergedFeatures.map === true

  console.log("[v0] ResidentMapPage - Map enabled:", mapEnabled)

  if (!mapEnabled) {
    redirect(`/t/${slug}/dashboard`)
  }

  const { data: locations } = await supabase
    .from("locations")
    .select(`
      *,
      lotsObject:lots(
        id,
        lot_number,
        users!inner(
          id,
          first_name,
          last_name,
          profile_picture_url,
          family_unit_id,
          family_units(id, name, profile_picture_url)
        )
      )
    `)
    .eq("tenant_id", tenant.id)

  const mappedLocations =
    locations?.map((loc: any) => ({
      ...loc,
      lot_id: loc.lotsObject?.id || loc.lot_id,
      lotNumber: loc.lotsObject?.lot_number || loc.lotNumber,
    })) || []

  console.log("[v0] ResidentMapPage - Locations count:", mappedLocations.length)

  const sampleLocation = mappedLocations.find((l: any) => l.name === "D-001")
  if (sampleLocation) {
    const locationJson = JSON.stringify(sampleLocation)
    console.log("[v0] Sample location D-001 data:", locationJson.substring(0, Math.min(500, locationJson.length)))
  } else {
    console.log("[v0] Sample location D-001 not found in mapped locations")
  }

  let calculatedCenter = tenant.map_center_coordinates
    ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
    : null

  if (!calculatedCenter) {
    const boundaryLocations = mappedLocations.filter((loc) => loc.type === "boundary" && loc.boundary_coordinates)
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

  let highlightLocationId: string | undefined
  if (highlightLot) {
    const lotLocation = mappedLocations.find((loc) => loc.lot_id === highlightLot && loc.type === "lot")
    if (lotLocation) {
      highlightLocationId = lotLocation.id
      console.log("[v0] ResidentMapPage - Highlighting location:", lotLocation.name)
    }
  }

  console.log("[v0] ResidentMapPage - Rendering map viewer")

  return (
    <FullMapClient
      locations={mappedLocations}
      tenantId={tenant.id}
      mapCenter={calculatedCenter}
      tenantSlug={slug}
      highlightLocationId={highlightLocationId}
    />
  )
}
