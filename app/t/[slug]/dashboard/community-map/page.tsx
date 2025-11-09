import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MapPreviewWidget } from "@/components/map/map-preview-widget"

export default async function CommunityMapPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: resident } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!resident) {
    redirect("/login")
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant || tenant.id !== resident.tenant_id) {
    redirect("/login")
  }

  const mapEnabled = tenant.features?.interactive_map === true

  if (!mapEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-muted-foreground">Interactive Map Not Available</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The community map feature is not enabled for this community.
          </p>
        </div>
      </div>
    )
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

  const mappedLocations = locations?.map((loc: any) => ({
    ...loc,
    lot_id: loc.lotsObject?.id || loc.lot_id,
  }))

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

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Interactive Community Map</h1>
        <p className="text-muted-foreground">Zoom, click locations, and explore the map below</p>
      </div>

      <MapPreviewWidget
        tenantId={tenant.id}
        locations={mappedLocations || []}
        mapCenter={mapCenter}
        mapZoom={15}
        minimal={false}
      />
    </div>
  )
}
