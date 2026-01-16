import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { getExchangeListings, getExchangeCategories } from "@/app/actions/exchange-listings"
import { getNeighborhoods } from "@/app/actions/neighborhoods"
import { getLocations } from "@/lib/data/locations"
import { CreateExchangeListingButton } from "@/components/exchange/create-exchange-listing-button"
import { ExchangePageClient } from "./exchange-page-client"
import { cache } from 'react'

const getCachedExchangeCategories = cache(async (tenantId: string) => {
  return await getExchangeCategories()
})

const getCachedNeighborhoods = cache(async (tenantId: string) => {
  return await getNeighborhoods(tenantId)
})

const getCachedLocations = cache(async (tenantId: string) => {
  return await getLocations(tenantId)
})

export default async function ExchangePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: userData } = await supabase
    .from("users")
    .select("id, tenant_id, lot_id, family_unit_id, onboarding_completed, role, is_tenant_admin")
    .eq("id", user.id)
    .single()

  if (!userData) {
    redirect(`/t/${slug}/login`)
  }

  // Check if exchange feature is enabled
  const { data: tenant } = await supabase.from("tenants").select("exchange_enabled").eq("id", userData.tenant_id).single()

  if (!tenant?.exchange_enabled) {
    redirect(`/t/${slug}/dashboard`)
  }

  const [listings, categories, neighborhoodsResult, locations] = await Promise.all([
    getExchangeListings(userData.tenant_id),
    getCachedExchangeCategories(userData.tenant_id),
    getCachedNeighborhoods(userData.tenant_id),
    getCachedLocations(userData.tenant_id)
  ])

  const neighborhoods = neighborhoodsResult.success ? neighborhoodsResult.data : []

  const mappedListings = listings.map(listing => ({
    ...listing,
    photos: listing.photos || [],
    condition: listing.condition || null,
    category: listing.category || null,
    creator: listing.creator || null,
    location: listing.location || null,
  }))

  const isAdmin = userData.is_tenant_admin || userData.role === "super_admin" || userData.role === "tenant_admin"

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Exchange Directory</h1>
              <p className="text-muted-foreground text-lg hidden md:block">
                Share, borrow, and trade within your community
              </p>
            </div>

            <CreateExchangeListingButton
              tenantSlug={slug}
              tenantId={userData.tenant_id}
              categories={categories}
              neighborhoods={neighborhoods}
            />
          </div>

          <ExchangePageClient
            listings={mappedListings}
            categories={categories}
            neighborhoods={neighborhoods}
            locations={locations}
            tenantId={userData.tenant_id}
            tenantSlug={slug}
            userId={user.id}
            userRole={userData.role}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  )
}
