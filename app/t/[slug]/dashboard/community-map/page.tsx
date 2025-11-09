import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Map } from "lucide-react"
import { CommunityMapClient } from "./community-map-client"
import { ResidentLocationsTable } from "@/components/map/resident-locations-table"
import { GoogleMapViewer } from "@/components/map/google-map-viewer"
import { redirect } from "next/navigation"

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
    redirect(`/t/${slug}/auth/login`)
  }

  const { data: resident } = await supabase.from("users").select("*").eq("id", user.id).eq("role", "resident").single()

  if (!resident) {
    redirect(`/t/${slug}/auth/login`)
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

  // Fetch location counts
  const { count: facilitiesCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "facility")

  const { count: lotsCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "lot")

  const { count: pathsCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "walking_path")

  const { count: neighborhoodsCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "neighborhood")

  const { count: protectionZonesCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "protection_zone")

  const { count: easementsCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "easement")

  const { count: playgroundsCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "playground")

  const { count: publicStreetsCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "public_street")

  const { count: greenAreasCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "green_area")

  const { count: recreationalZonesCount } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("type", "recreational_zone")

  const { data: locations } = await supabase
    .from("locations")
    .select(`
      *, 
      neighborhoods!locations_neighborhood_id_fkey(name),
      lots!locations_lot_id_fkey(
        id, 
        lot_number,
        users!users_lot_id_fkey(
          id, 
          first_name, 
          last_name, 
          profile_picture_url,
          family_units!users_family_unit_id_fkey(
            id,
            name,
            profile_picture_url,
            description
          )
        )
      )
    `)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  let mapCenter = tenant?.map_center_coordinates
    ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
    : null

  // If no manual center is set, calculate from boundary locations
  if (!mapCenter && locations) {
    const boundaryLocations = locations.filter((loc) => loc.type === "boundary")
    if (boundaryLocations.length > 0) {
      const allCoords: Array<{ lat: number; lng: number }> = []
      boundaryLocations.forEach((loc) => {
        if (loc.boundary_coordinates) {
          loc.boundary_coordinates.forEach((coord: [number, number]) => {
            allCoords.push({ lat: coord[0], lng: coord[1] })
          })
        }
      })

      if (allCoords.length > 0) {
        const avgLat = allCoords.reduce((sum, coord) => sum + coord.lat, 0) / allCoords.length
        const avgLng = allCoords.reduce((sum, coord) => sum + coord.lng, 0) / allCoords.length
        mapCenter = { lat: avgLat, lng: avgLng }
      }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Community Map</h1>
        <p className="text-muted-foreground">Explore locations and facilities in your community</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Interactive Community Map</CardTitle>
              <CardDescription>Zoom, click locations, and explore the map below</CardDescription>
            </div>
            <Link href={`/t/${slug}/dashboard/map`}>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                <Map className="h-4 w-4" />
                View Full Map
              </button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg overflow-hidden border">
            <GoogleMapViewer
              locations={locations || []}
              tenantId={tenant.id}
              mapCenter={mapCenter}
              mapZoom={15}
              minimal={false}
            />
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <CommunityMapClient
          counts={{
            facilities: facilitiesCount || 0,
            lots: lotsCount || 0,
            neighborhoods: neighborhoodsCount || 0,
            walkingPaths: pathsCount || 0,
            protectionZones: protectionZonesCount || 0,
            easements: easementsCount || 0,
            playgrounds: playgroundsCount || 0,
            publicStreets: publicStreetsCount || 0,
            greenAreas: greenAreasCount || 0,
            recreationalZones: recreationalZonesCount || 0,
          }}
        />
      </div>

      {/* Locations Table */}
      <ResidentLocationsTable locations={locations || []} tenantSlug={slug} initialTypeFilter={initialTypeFilter} />
    </div>
  )
}
