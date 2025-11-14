import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from 'lucide-react'
import { getExchangeListings } from "@/app/actions/exchange-listings"
import { CreateExchangeListingButton } from "@/components/exchange/create-exchange-listing-button"
import { ExchangeListingCard } from "@/components/exchange/exchange-listing-card"

export default async function ExchangePage({ params }: { params: Promise<{ slug: string }> }) {
  console.log("[v0] ExchangePage - Rendering")
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

  const listings = await getExchangeListings(resident.tenant_id)
  console.log("[v0] ExchangePage - Listings fetched:", listings.length)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Exchange Directory</h2>
          <p className="text-muted-foreground">Share, borrow, and trade within your community</p>
        </div>
        {resident.onboarding_completed && (
          <CreateExchangeListingButton tenantSlug={slug} tenantId={resident.tenant_id} />
        )}
      </div>

      {listings.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Package className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">No listings yet</CardTitle>
            <CardDescription className="text-base">Be the first to share something with your community!</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <p className="text-sm text-muted-foreground">Listings will appear here once created. Check back soon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ExchangeListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
