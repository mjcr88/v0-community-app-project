import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, MapPin, Globe, Languages, PawPrint, Home, MapIcon } from 'lucide-react'
import Link from "next/link"
import { MapPreviewWidget } from "@/components/map/map-preview-widget"
import { UpcomingEventsWidget } from "@/components/dashboard/upcoming-events-widget"
import { getUpcomingEvents } from "@/app/actions/events"
import { CreateCheckInButton } from "@/components/check-ins/create-check-in-button"
import { CheckInsCountWidget } from "@/components/dashboard/checkins-count-widget"
import { LiveCheckInsWidget } from "@/components/dashboard/live-checkins-widget"
import { getActiveCheckIns } from "@/app/actions/check-ins"
import { MyExchangeListingsWidget } from "@/components/exchange/my-exchange-listings-widget"
import { getUserListings } from "@/app/actions/exchange-listings"
import { getLocations } from "@/lib/queries/get-locations"
import { cache } from 'react'

const getCachedLocations = cache(async (tenantId: string) => {
  return await getLocations(tenantId)
})

const getCachedExchangeCategories = cache(async (tenantId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("exchange_categories")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("name")
  return data || []
})

const getCachedNeighborhoods = cache(async (tenantId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("neighborhoods")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("name")
  return data || []
})

const getCachedTenant = cache(async (tenantId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single()
  return data
})

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

  const tenant = await getCachedTenant(resident.tenant_id)

  const petsEnabled = tenant?.features?.pets === true
  const checkinsEnabled = tenant?.checkins_enabled === true
  const exchangeEnabled = tenant?.exchange_enabled === true
  const defaultFeatures = {
    map: true,
  }
  const mergedFeatures = { ...defaultFeatures, ...(tenant?.features || {}) }
  const mapEnabled = mergedFeatures.map === true

  console.log("[v0] Dashboard features:", {
    checkinsEnabled,
    eventsEnabled: tenant?.events_enabled,
    tenantCheckinsColumn: tenant?.checkins_enabled,
  })

  let lotLocation = null
  let allLocations = []
  if (mapEnabled && resident.lot_id) {
    allLocations = await getCachedLocations(resident.tenant_id)

    console.log("[v0] Dashboard locations query:", { count: allLocations?.length })

    lotLocation = allLocations?.find((loc) => loc.lot_id === resident.lot_id && loc.type === "lot" && loc.lot_id !== null)

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

  const upcomingEventsWithFlags = await Promise.all(
    upcomingEvents.map(async (event) => {
      const { data: flagCount } = await supabase.rpc("get_event_flag_count", {
        p_event_id: event.id,
        p_tenant_id: resident.tenant_id,
      })
      return {
        ...event,
        flag_count: flagCount ?? 0,
      }
    }),
  )

  let activeCheckIns: any[] = []
  if (checkinsEnabled) {
    activeCheckIns = await getActiveCheckIns(resident.tenant_id)
  }

  let userListings: any[] = []
  let exchangeCategories: any[] = []
  let exchangeNeighborhoods: any[] = []
  let allTenantLocations: any[] = []
  
  if (exchangeEnabled) {
    userListings = await getUserListings(user.id, resident.tenant_id)
    
    exchangeCategories = await getCachedExchangeCategories(resident.tenant_id)
    exchangeNeighborhoods = await getCachedNeighborhoods(resident.tenant_id)
    allTenantLocations = await getCachedLocations(resident.tenant_id)
  }

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
          {checkinsEnabled && <CreateCheckInButton tenantSlug={slug} tenantId={resident.tenant_id} />}
          <Button asChild variant="outline">
            <Link href={`/t/${slug}/dashboard/settings/profile`}>Edit Profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/t/${slug}/dashboard/neighbours`}>Browse Neighbours</Link>
          </Button>
          {mapEnabled && (
            <Button asChild variant="outline">
              <Link href={`/t/${slug}/dashboard/map`}>
                <MapIcon className="h-4 w-4 mr-2" />
                View Community Map
              </Link>
            </Button>
          )}
          {exchangeEnabled && (
            <Button asChild variant="outline">
              <Link href={`/t/${slug}/dashboard/exchange`}>
                View My Listings
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

      {checkinsEnabled && activeCheckIns.length > 0 && (
        <LiveCheckInsWidget
          initialCheckIns={activeCheckIns}
          tenantSlug={slug}
          tenantId={resident.tenant_id}
          userId={user.id}
        />
      )}

      {exchangeEnabled && userListings.length > 0 && (
        <MyExchangeListingsWidget
          listings={userListings}
          tenantSlug={slug}
          tenantId={resident.tenant_id}
          userId={user.id}
          categories={exchangeCategories}
          neighborhoods={exchangeNeighborhoods}
          locations={allTenantLocations}
        />
      )}

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
                checkIns={activeCheckIns}
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

        {checkinsEnabled && <CheckInsCountWidget initialCount={activeCheckIns.length} />}

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
