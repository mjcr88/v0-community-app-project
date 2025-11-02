import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, MapPin, Globe, Languages, PawPrint, Home } from "lucide-react"
import Link from "next/link"

export default async function ResidentDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
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
            <Link href={`/t/${slug}/dashboard/settings/profile`}>Edit Profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/t/${slug}/dashboard/neighbours`}>Browse Neighbours</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <Card>
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
          <Card>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages Spoken</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allLanguages.size}</div>
            <p className="text-xs text-muted-foreground">Different languages</p>
          </CardContent>
        </Card>

        <Card>
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
          <Card>
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

        <Card>
          <CardHeader>
            <CardTitle>Journey Stage</CardTitle>
            <CardDescription>Your current stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{resident.journey_stage || "Not set"}</div>
            <p className="text-xs text-muted-foreground">Your current stage</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
