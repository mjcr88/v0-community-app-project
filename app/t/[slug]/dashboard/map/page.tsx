import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FullMapClient } from "./full-map-client"

export default async function ResidentMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lot?: string }>
}) {
  const { slug } = await params
  const { lot: highlightLot } = await searchParams

  console.log("[v0] ResidentMapPage - Starting, slug:", slug, "highlightLot:", highlightLot)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  console.log("[v0] ResidentMapPage - Auth user:", user.id)

  const { data: resident } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!resident) {
    redirect("/login")
  }

  console.log("[v0] ResidentMapPage - Resident data:", resident.id)

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant || tenant.id !== resident.tenant_id) {
    redirect("/login")
  }

  console.log("[v0] ResidentMapPage - Tenant data:", tenant.id)

  const mapEnabled = tenant.features?.interactive_map === true

  console.log("[v0] ResidentMapPage - Map enabled:", mapEnabled)

  if (!mapEnabled) {
    redirect(`/t/${slug}/dashboard`)
  }

  const { data: locations } = await supabase
    .from("locations")
    .select(
      `
      *,
      lotsObject:lots(
        id,
        lot_number,
        users(
          id,
          first_name,
          last_name,
          profile_picture_url,
          family_units(
            id,
            name,
            description,
            profile_picture_url
          ),
          pets(
            id,
            name,
            species,
            profile_picture_url
          )
        )
      )
    `,
    )
    .eq("tenant_id", tenant.id)

  console.log("[v0] ResidentMapPage - Locations count:", locations?.length)

  const mappedLocations = locations?.map((loc: any) => ({
    ...loc,
    lot_id: loc.lotsObject?.id || loc.lot_id,
  }))

  if (mappedLocations && mappedLocations.length > 0) {
    const sampleLocation = mappedLocations.find((l: any) => l.name === "D-001")
    if (sampleLocation) {
      const sampleStr = JSON.stringify(sampleLocation)
      console.log("[v0] Sample location D-001 data:", sampleStr.substring(0, 500))
    }
  }

  let highlightLocationId: string | undefined = undefined

  if (highlightLot && mappedLocations) {
    const lotLocation = mappedLocations.find((loc: any) => loc.lotNumber === highlightLot || loc.name === highlightLot)
    if (lotLocation) {
      highlightLocationId = lotLocation.id
    }
  }

  const boundary = tenant.geojson_boundaries as any

  let mapCenter = { lat: 9.9, lng: -84.5 }

  if (boundary?.features?.[0]?.geometry?.coordinates) {
    const coords = boundary.features[0].geometry.coordinates[0]
    if (coords && coords.length > 0) {
      const lats = coords.map((c: number[]) => c[1])
      const lngs = coords.map((c: number[]) => c[0])

      const avgLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length
      const avgLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length

      mapCenter = { lat: avgLat, lng: avgLng }
    }
  }

  console.log("[v0] ResidentMapPage - Calculated center from boundaries:", mapCenter)
  console.log("[v0] ResidentMapPage - Rendering map viewer")

  return (
    <FullMapClient
      locations={mappedLocations || []}
      tenantId={tenant.id}
      mapCenter={mapCenter}
      highlightLocationId={highlightLocationId}
    />
  )
}
