import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, MapPin, Globe, Languages, PawPrint, Home, MapIcon } from 'lucide-react'
import Link from "next/link"
import { UpcomingEventsWidget } from "@/components/dashboard/upcoming-events-widget"
import { CreateCheckInButton } from "@/components/check-ins/create-check-in-button"
import { CheckInsCountWidget } from "@/components/dashboard/checkins-count-widget"
import { LiveCheckInsWidget } from "@/components/dashboard/live-checkins-widget"
import { MyExchangeListingsWidget } from "@/components/exchange/my-exchange-listings-widget"
import { getUserListings } from "@/app/actions/exchange-listings"
import { cache } from 'react'
import { MapSectionLazy } from "@/components/dashboard/map-section-lazy"
import { DashboardSectionCollapsible } from "@/components/dashboard/dashboard-section-collapsible"
import { MyListingsAndTransactionsWidget } from "@/components/exchange/my-listings-and-transactions-widget"
import { getMyTransactions } from "@/app/actions/exchange-transactions"
import { CreateExchangeListingButton } from "@/components/exchange/create-exchange-listing-button"

const getCachedUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

const getCachedResident = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data: resident } = await supabase
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
    .eq("id", userId)
    .eq("role", "resident")
    .single()
  return resident
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

const getCachedUserListings = cache(async (userId: string, tenantId: string) => {
  return await getUserListings(userId, tenantId)
})

const getCachedUserTransactions = cache(async (userId: string, tenantId: string) => {
  return await getMyTransactions(userId, tenantId)
})

export default async function ResidentDashboardPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const supabase = await createClient()

  const user = await getCachedUser()

  if (!user) {
    return null
  }

  const resident = await getCachedResident(user.id)

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

  let lotLocationId: string | undefined
  if (mapEnabled && resident.lot_id) {
    const { data: lotLocation } = await supabase
      .from("locations")
      .select("id")
      .eq("lot_id", resident.lot_id)
      .eq("type", "lot")
      .maybeSingle()
    
    lotLocationId = lotLocation?.id
  }

  // Get total residents count in neighborhood (or tenant if no neighborhood)
  const neighborhoodId = resident.lots?.neighborhoods?.id
  let totalResidents = 0

  if (neighborhoodId) {
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

    if (resident.family_units?.name) {
      familyName = resident.family_units.name
    }
  }

  const mapCenter = tenant?.map_center_coordinates
    ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
    : null

  let userListings: any[] = []
  let exchangeCategories: any[] = []
  let exchangeNeighborhoods: any[] = []
  let userTransactions: any[] = []
  
  if (exchangeEnabled) {
    userListings = await getCachedUserListings(user.id, resident.tenant_id)
    exchangeCategories = await getCachedExchangeCategories(resident.tenant_id)
    exchangeNeighborhoods = await getCachedNeighborhoods(resident.tenant_id)
    userTransactions = await getCachedUserTransactions(user.id, resident.tenant_id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {resident.first_name || "Resident"}!</h2>
        <p className="text-muted-foreground">Here's what's happening in your community</p>
      </div>

      <DashboardSectionCollapsible title="Quick Actions" description="Get started with your community dashboard">
        <div className="flex flex-wrap gap-2">
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
            <CreateExchangeListingButton
              tenantSlug={slug}
              tenantId={resident.tenant_id}
              categories={exchangeCategories}
              neighborhoods={exchangeNeighborhoods}
              variant="outline"
            />
          )}
        </div>
      </DashboardSectionCollapsible>

      <DashboardSectionCollapsible 
        title="Upcoming Events" 
        description="Your next events"
        defaultOpen={false}
      >
        <UpcomingEventsWidget
          slug={slug}
          userId={user.id}
          tenantId={resident.tenant_id}
        />
      </DashboardSectionCollapsible>

      {checkinsEnabled && (
        <DashboardSectionCollapsible 
          title="Live Check-ins"
          description="Active residents now"
          defaultOpen={false}
        >
          <LiveCheckInsWidget
            tenantSlug={slug}
            tenantId={resident.tenant_id}
            userId={user.id}
          />
        </DashboardSectionCollapsible>
      )}

      {exchangeEnabled && (userListings.length > 0 || userTransactions.length > 0) && (
        <DashboardSectionCollapsible 
          title="My Listings & Transactions"
          description="Manage your exchange listings and track active exchanges"
          defaultOpen={true}
        >
          <MyListingsAndTransactionsWidget
            listings={userListings}
            transactions={userTransactions}
            tenantSlug={slug}
            tenantId={resident.tenant_id}
            userId={user.id}
            categories={exchangeCategories}
            neighborhoods={exchangeNeighborhoods}
            locations={[]} // Will be fetched by modal on demand
          />
        </DashboardSectionCollapsible>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mapEnabled && resident.lot_id ? (
          <MapSectionLazy
            tenantSlug={slug}
            tenantId={resident.tenant_id}
            lotLocationId={lotLocationId}
            mapCenter={mapCenter}
            checkIns={[]} // Will be fetched by widget on demand
            neighborhoodName={resident.lots?.neighborhoods?.name}
            lotNumber={resident.lots?.lot_number}
          />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Neighborhood</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resident.lots?.neighborhoods?.name || "Not assigned"}</div>
              <p className="text-xs text-muted-foreground">Lot #{resident.lots?.lot_number || "N/A"}</p>
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

        {checkinsEnabled && <CheckInsCountWidget initialCount={0} />}

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
