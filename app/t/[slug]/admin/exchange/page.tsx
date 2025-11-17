import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Plus, Package } from 'lucide-react'
import Link from "next/link"
import { AdminExchangeTable } from "./admin-exchange-table"

export default async function AdminExchangePage({
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
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect("/backoffice/login")
  }

  const { data: categories } = await supabase
    .from("exchange_categories")
    .select("id, name, description")
    .eq("tenant_id", tenant.id)
    .order("name")

  // Fetch all exchange listings for the tenant with necessary joins
  const { data: listings, error: listingsError } = await supabase
    .from("exchange_listings")
    .select(`
      *,
      exchange_categories:category_id (
        id,
        name,
        description
      ),
      users:created_by (
        id,
        first_name,
        last_name,
        email
      ),
      locations:location_id (
        id,
        name
      )
    `)
    .eq("tenant_id", tenant.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })

  if (listingsError) {
    console.error("[v0] Error fetching listings:", listingsError)
  }

  // Fetch flag counts for all listings
  const { data: flagData } = await supabase
    .from("exchange_flags")
    .select("listing_id")
    .in("listing_id", listings?.map((l) => l.id) || [])

  // Calculate flag counts per listing
  const flagCounts = flagData?.reduce(
    (acc, flag) => {
      if (!acc[flag.listing_id]) acc[flag.listing_id] = 0
      acc[flag.listing_id] += 1
      return acc
    },
    {} as Record<string, number>,
  )

  const enrichedListings = listings?.map((listing) => ({
    ...listing,
    flag_count: flagCounts?.[listing.id] || 0,
    location_name:
      listing.custom_location_name || (listing.locations as any)?.name || null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Exchange Listings</h2>
          <p className="text-muted-foreground">Manage all exchange listings in your community</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/t/${slug}/admin/exchange/categories`}>
              <Package className="mr-2 h-4 w-4" />
              Categories
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/t/${slug}/dashboard/exchange/create`}>
              <Plus className="mr-2 h-4 w-4" />
              Create Listing
            </Link>
          </Button>
        </div>
      </div>

      {!enrichedListings || enrichedListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Get started by creating your first listing</p>
          <Button asChild>
            <Link href={`/t/${slug}/dashboard/exchange/create`}>
              <Plus className="mr-2 h-4 w-4" />
              Create Listing
            </Link>
          </Button>
        </div>
      ) : (
        <AdminExchangeTable listings={enrichedListings} slug={slug} tenantId={tenant.id} categories={categories || []} />
      )}
    </div>
  )
}
