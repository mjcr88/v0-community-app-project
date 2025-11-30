import { createClient } from "@/lib/supabase/server"
import { UpcomingEventsWidget } from "@/components/dashboard/upcoming-events-widget"
import { LiveCheckInsWidget } from "@/components/dashboard/live-checkins-widget"
import { getUserListings } from "@/app/actions/exchange-listings"
import { cache } from 'react'
import { MapSectionLazy } from "@/components/dashboard/map-section-lazy"
import { MyListingsAndTransactionsWidget } from "@/components/exchange/my-listings-and-transactions-widget"
import { getMyTransactions } from "@/app/actions/exchange-transactions"
import { getMyRequests } from "@/app/actions/resident-requests"
import { MyRequestsWidget } from "@/components/requests/my-requests-widget"
import { AnnouncementsWidget } from "@/components/dashboard/announcements-widget"
import { PriorityFeed } from "@/components/ecovilla/dashboard/PriorityFeed"
import { StatsGrid } from "@/components/dashboard/StatsGrid"
import { RioWelcomeCard } from "@/components/ecovilla/dashboard/RioWelcomeCard"
import { ShineBorder } from "@/components/library/shine-border"
import { DashboardSections } from "@/components/ecovilla/dashboard/DashboardSections"

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

export default async function ResidentDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
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

  const checkinsEnabled = tenant?.checkins_enabled === true
  const exchangeEnabled = tenant?.exchange_enabled === true
  const requestsEnabled = tenant?.requests_enabled ?? true
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

  const mapCenter = tenant?.map_center_coordinates
    ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
    : null

  let userListings: any[] = []
  let exchangeCategories: any[] = []
  let exchangeNeighborhoods: any[] = []
  let userTransactions: any[] = []
  let myRequests: any[] = []

  if (exchangeEnabled) {
    userListings = await getCachedUserListings(user.id, resident.tenant_id)
    exchangeCategories = await getCachedExchangeCategories(resident.tenant_id)
    exchangeNeighborhoods = await getCachedNeighborhoods(resident.tenant_id)
    userTransactions = await getCachedUserTransactions(user.id, resident.tenant_id)
  }

  if (requestsEnabled && resident.tenant_id) {
    myRequests = await getMyRequests(resident.tenant_id)
  }

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {resident.first_name || "Resident"}!</h2>
        <p className="text-muted-foreground">Here's what's happening in your community</p>
      </div>

      {/* Two-Column Layout: Stats + What's Next */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left Column: What's Next */}
        <div className="flex flex-col relative">
          <h3 className="text-lg font-semibold mb-3">What's Next</h3>
          <div className="relative rounded-xl overflow-hidden border bg-background">
            <ShineBorder className="absolute inset-0 pointer-events-none z-10" shineColor={["#D97742", "#6B9B47"]} />
            <div className="relative z-0 h-full">
              <PriorityFeed slug={slug} userId={user.id} tenantId={resident.tenant_id} />
            </div>
          </div>
        </div>

        {/* Right Column: Rio & Stats */}
        <div className="flex flex-col space-y-6">
          {/* Top Right: Rio Welcome */}
          <div>
            {/* Spacer to align with "What's Next" title on large screens */}
            <h3 className="text-lg font-semibold mb-3 invisible hidden lg:block" aria-hidden="true">Spacer</h3>
            <RioWelcomeCard />
          </div>

          {/* Bottom Right: Stats */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
            <StatsGrid />
          </div>
        </div>
      </div>

      {/* Dashboard Sections (Interactive) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Explore & catch-up</h3>
        <DashboardSections
          announcements={
            <AnnouncementsWidget
              slug={slug}
              userId={user.id}
              tenantId={resident.tenant_id}
            />
          }
          events={
            <UpcomingEventsWidget
              slug={slug}
              userId={user.id}
              tenantId={resident.tenant_id}
            />
          }
          checkins={
            checkinsEnabled ? (
              <LiveCheckInsWidget
                tenantSlug={slug}
                tenantId={resident.tenant_id}
                userId={user.id}
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground">Check-ins are disabled for this community.</div>
            )
          }
          listings={
            exchangeEnabled ? (
              <MyListingsAndTransactionsWidget
                listings={userListings}
                transactions={userTransactions}
                tenantSlug={slug}
                tenantId={resident.tenant_id}
                userId={user.id}
                categories={exchangeCategories}
                neighborhoods={exchangeNeighborhoods}
                locations={[]}
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground">Exchange is disabled for this community.</div>
            )
          }
          requests={
            requestsEnabled ? (
              <MyRequestsWidget requests={myRequests} tenantSlug={slug} />
            ) : (
              <div className="p-4 text-center text-muted-foreground">Requests are disabled for this community.</div>
            )
          }
          map={
            mapEnabled && resident.lot_id ? (
              <MapSectionLazy
                tenantSlug={slug}
                tenantId={resident.tenant_id}
                lotLocationId={lotLocationId}
                mapCenter={mapCenter}
                checkIns={[]}
                neighborhoodName={resident.lots?.neighborhoods?.name}
                lotNumber={resident.lots?.lot_number}
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground">Map is not available.</div>
            )
          }
        />
      </div>
    </div>
  )
}
