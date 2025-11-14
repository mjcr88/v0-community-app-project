import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { getExchangeListings, getExchangeCategories } from "@/app/actions/exchange-listings"
import { getNeighborhoods } from "@/app/actions/neighborhoods"
import { getLocations } from "@/lib/queries/get-locations"
import { CreateExchangeListingButton } from "@/components/exchange/create-exchange-listing-button"
import { ExchangePageClient } from "./exchange-page-client"

export default async function ExchangePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: resident } = await supabase
    .from("users")
    .select("id, tenant_id, lot_id, family_unit_id, onboarding_completed")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  // Check if exchange feature is enabled
  const { data: tenant } = await supabase.from("tenants").select("exchange_enabled").eq("id", resident.tenant_id).single()

  if (!tenant?.exchange_enabled) {
    redirect(`/t/${slug}/dashboard`)
  }

  const [listings, categories, neighborhoodsResult, locations] = await Promise.all([
    getExchangeListings(resident.tenant_id),
    getExchangeCategories(resident.tenant_id),
    getNeighborhoods(resident.tenant_id),
    getLocations(resident.tenant_id)
  ])

  const neighborhoods = neighborhoodsResult.success ? neighborhoodsResult.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Exchange Directory</h2>
          <p className="text-muted-foreground">Share, borrow, and trade within your community</p>
        </div>
        {resident.onboarding_completed && (
          <CreateExchangeListingButton 
            tenantSlug={slug} 
            tenantId={resident.tenant_id}
            categories={categories}
            neighborhoods={neighborhoods}
          />
        )}
      </div>

      <ExchangePageClient 
        listings={listings}
        categories={categories}
        neighborhoods={neighborhoods}
        locations={locations}
        tenantId={resident.tenant_id}
        tenantSlug={slug}
        userId={user.id}
      />
    </div>
  )
}
