import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, MapPin, Globe, Languages, PawPrint, Home, Map } from "lucide-react"
import Link from "next/link"
import { MapPreviewWidget } from "@/components/map/map-preview-widget"
import { UpcomingEventsWidget } from "@/components/dashboard/upcoming-events-widget"
import { getUpcomingEvents } from "@/app/actions/events"

export default async function ResidentDashboardPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Dashboard - Auth user:", user?.id)

  if (!user) {
    return null
  }

  const { data: resident, error: residentError } = await supabase
    .from("users")
    .select(
      `
      *,
      lots (
        lot_number,
        neighborhoods (
          name,
          id
        )
      ),
      family_units (
        name,
        id
      )
    `,
    )
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  console.log("[v0] Dashboard resident query:", { resident, residentError })

  if (resident) {
    console.log("[v0] Dashboard lot data:", {
      lot_id: resident.lot_id,
      lots: resident.lots,
      neighborhood: resident.lots?.neighborhoods,
    })
  }

  if (!resident) {
    return null
  }

  // Get tenant to check features
  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", resident.tenant_id).single()

  const petsEnabled = tenant?.features?.pets === true
  const defaultFeatures = {
    map: true,
  }
  const mergedFeatures = { ...defaultFeatures, ...(tenant?.features || {}) }
  const mapEnabled = mergedFeatures.map === true

  console.log("[v0] Dashboard map feature check:", {
    tenantFeatures: tenant?.features,
    mapEnabled,
    mergedFeatures,
  })

  let lotLocation = null
  let allLocations = []
  if (mapEnabled && resident.lot_id) {
    const { data: locations } = await supabase.from("locations").select("*").eq("tenant_id", resident.tenant_id)

    console.log("[v0] Dashboard locations query:", { count: locations?.length })

    allLocations = locations || []
    lotLocation = locations?.find((loc) => loc.lot_id === resident.lot_id && loc.type === "lot" && loc.lot_id !== null)

    console.log("[v0] Dashboard lot location:", {
      lotLocation: lotLocation?.name,
      lotLocationId: lotLocation?.id,
      residentLotId: resident.lot_id,
      locationHasLotId: lotLocation?.lot_id !== null,
    })
  }

  // Get total residents count in neighborhood (or tenant if no neighborhood)
  const neighborhoodId = resident.lots?.neighborhoods?.id
  let totalResidents = 0

  if (neighborhoodId) {
    // Query users who have lots in this neighborhood
    const { data: residentsInNeighborhood } = await supabase
      .from("users")
      .select("id, lot_id, lots!inner(neighborhood_id)")
      .eq("tenant_id", resident.tenant_id)
      .eq("role", "resident")
      .eq("lots.neighborhood_id", neighborhoodId)

    totalResidents = residentsInNeighborhood?.length || 0
  } else {
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", resident.tenant_id)
      .eq("role", "resident")

    totalResidents = count || 0
  }

  // Get unique languages count in neighborhood
  const { data: languagesData } = await supabase
    .from("users")
    .select("languages")
    .eq("tenant_id", resident.tenant_id)
    .eq("role", "resident")
    .not("languages", "is", null)

  const allLanguages = new Set<string>()
  languagesData?.forEach((user) => {
    user.languages?.forEach((lang: string) => allLanguages.add(lang))
  })

  // Get unique origin countries count in neighborhood
  const { data: countriesData } = await supabase
    .from("users")
    .select("birth_country")
    .eq("tenant_id", resident.tenant_id)
    .eq("role", "resident")
    .not("birth_country", "is", null)

  const uniqueCountries = new Set(countriesData?.map((u) => u.birth_country).filter(Boolean))

  console.log("[v0] Dashboard countries data:", { countriesData, uniqueCountries: Array.from(uniqueCountries) })

  // Get pets count if enabled
  let petsCount = 0
  if (petsEnabled && neighborhoodId) {
    const { count } = await supabase
      .from("pets")
      .select("*, lot_id!inner(neighborhoods!inner(id))", { count: "only", head: true })
      .eq("lot_id.neighborhoods.id", neighborhoodId)

    petsCount = count || 0
  }

  const familyUnitId = resident.family_unit_id && resident.family_unit_id !== "" ? resident.family_unit_id : null

  let familyMembersCount = 0
  let familyName = "Family"

  if (familyUnitId) {
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("family_unit_id", familyUnitId)
      .eq("role", "resident")

    familyMembersCount = count || 0

    // Get family unit name
    if (resident.family_units?.name) {
      familyName = resident.family_units.name
    }
  }

  console.log("[v0] Dashboard family data:", { familyUnitId, familyMembersCount, familyName })

  const mapCenter = tenant?.map_center_coordinates
    ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
    : null

  const upcomingEvents = await getUpcomingEvents(resident.tenant_id, 5)

  const eventIds = upcomingEvents.map((e) => e.id)
  const { data: flagCounts } = await supabase
    .from("event_flags")
    .select("event_id")
    .in("event_id", eventIds)
    .eq("tenant_id", resident.tenant_id)

  const flagCountMap = new Map<string, number>()
  flagCounts?.forEach((flag) => {
    flagCountMap.set(flag.event_id, (flagCountMap.get(flag.event_id) || 0) + 1)
  })

  const upcomingEventsWithFlags = upcomingEvents.map((event) => ({
    ...event,
    flag_count: flagCountMap.get(event.id) || 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {resident.first_name || "Resident"}!</h2>
        <p className="text-muted-foreground">Here's what's happening in your community</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with your community dashboard</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {!resident.onboarding_completed && (
            <Button asChild>
              <Link href={`/t/${slug}/onboarding/welcome`}>Complete Onboarding</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href={`/t/${slug}/dashboard/events/create`}>Create Event</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/t/${slug}/dashboard/settings/profile`}>Edit Profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/t/${slug}/dashboard/neighbours`}>Browse Neighbours</Link>
          </Button>
          {mapEnabled && (
            <Button asChild variant="outline">
              <Link href={`/t/${slug}/dashboard/map`}>
                <Map className="h-4 w-4 mr-2" />
                View Community Map
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <UpcomingEventsWidget
        events={upcomingEventsWithFlags}
        slug={slug}
        userId={user.id}
        tenantId={resident.tenant_id}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mapEnabled && lotLocation ? (
          <Card className="md:col-span-2 lg:col-span-2 lg:row-span-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Neighborhood</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-2xl font-bold">{resident.lots?.neighborhoods?.name || "Not assigned"}</div>
                <p className="text-xs text-muted-foreground">Lot #{resident.lots?.lot_number || "N/A"}</p>
              </div>
              <MapPreviewWidget
                tenantSlug={slug}
                tenantId={resident.tenant_id}
                locations={allLocations}
                mapCenter={mapCenter}
                highlightLocationId={lotLocation?.lot_id ? lotLocation.id : undefined}
              />
              <p className="text-xs text-center text-muted-foreground">
                Interact with map or click expand button to view full map
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Neighborhood</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resident.lots?.neighborhoods?.name || "Not assigned"}</div>
              <p className="text-xs text-muted-foreground">Lot #{resident.lots?.lot_number || "N/A"}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Map: {mapEnabled ? "enabled" : "disabled"}, Lot: {lotLocation ? "found" : "not found"}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResidents}</div>
            <p className="text-xs text-muted-foreground">
              {neighborhoodId ? "In your neighborhood" : "Total residents"}
            </p>
          </CardContent>
        </Card>

        {familyUnitId && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{familyName}</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{familyMembersCount}</div>
              <p className="text-xs text-muted-foreground">Family members</p>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages Spoken</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allLanguages.size}</div>
            <p className="text-xs text-muted-foreground">Different languages</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Origin Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCountries.size}</div>
            <p className="text-xs text-muted-foreground">Countries represented</p>
          </CardContent>
        </Card>

        {petsEnabled && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Pets</CardTitle>
              <PawPrint className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{petsCount}</div>
              <p className="text-xs text-muted-foreground">Furry friends</p>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Journey Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{resident.journey_stage || "Not set"}</div>
            <p className="text-xs text-muted-foreground">Current stage</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
