import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function TenantAdminDashboard({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerClient()

  // Get tenant info
  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: superAdmin } = await supabase
    .from("users")
    .select("role")
    .eq("id", user?.id || "")
    .single()

  const isSuperAdmin = superAdmin?.role === "super_admin"

  const features = (tenant?.features as Record<string, boolean>) || {
    neighborhoods: true,
    interests: true,
    skills: true,
    pets: true,
    families: true,
    lots: true,
  }

  const { count: neighborhoodsCount } = await supabase
    .from("neighborhoods")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant?.id || "")

  const { data: neighborhoodIds } = await supabase
    .from("neighborhoods")
    .select("id")
    .eq("tenant_id", tenant?.id || "")

  const neighborhoodIdList = neighborhoodIds?.map((n) => n.id) || []

  const { count: lotsCount } = await supabase
    .from("lots")
    .select("*", { count: "exact", head: true })
    .in("neighborhood_id", neighborhoodIdList)

  const { data: lotIds } = await supabase.from("lots").select("id").in("neighborhood_id", neighborhoodIdList)

  const lotIdList = lotIds?.map((l) => l.id) || []

  const { count: residentsCount } = await supabase
    .from("residents")
    .select("*", { count: "exact", head: true })
    .in("lot_id", lotIdList)

  const { count: familiesCount } = await supabase
    .from("family_units")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant?.id || "")

  const { data: familyIds } = await supabase
    .from("family_units")
    .select("id")
    .eq("tenant_id", tenant?.id || "")

  const familyIdList = familyIds?.map((f) => f.id) || []

  const { count: petsCount } = await supabase
    .from("pets")
    .select("*", { count: "exact", head: true })
    .in("family_unit_id", familyIdList)

  const { count: interestsCount } = await supabase
    .from("interests")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant?.id || "")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of {tenant?.name || "your community"}</p>
      </div>

      {isSuperAdmin && features.onboarding && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Testing Tools</CardTitle>
            <CardDescription>Super admin testing utilities</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href={`/t/${slug}/onboarding`}>Test Onboarding Flow</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.neighborhoods && (
          <Card>
            <CardHeader>
              <CardTitle>Neighborhoods</CardTitle>
              <CardDescription>Community neighborhoods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{neighborhoodsCount || 0}</p>
                <p className="text-sm text-muted-foreground">Total neighborhoods</p>
              </div>
            </CardContent>
          </Card>
        )}

        {features.lots && (
          <Card>
            <CardHeader>
              <CardTitle>Lots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{lotsCount || 0}</p>
                <p className="text-sm text-muted-foreground">Total lots</p>
              </div>
            </CardContent>
          </Card>
        )}

        {features.residents && (
          <Card>
            <CardHeader>
              <CardTitle>Residents</CardTitle>
              <CardDescription>Community members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{residentsCount || 0}</p>
                <p className="text-sm text-muted-foreground">Total residents</p>
              </div>
            </CardContent>
          </Card>
        )}

        {features.families && (
          <Card>
            <CardHeader>
              <CardTitle>Family Units</CardTitle>
              <CardDescription>Family groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{familiesCount || 0}</p>
                <p className="text-sm text-muted-foreground">Total families</p>
              </div>
            </CardContent>
          </Card>
        )}

        {features.pets && (
          <Card>
            <CardHeader>
              <CardTitle>Pets</CardTitle>
              <CardDescription>Registered pets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{petsCount || 0}</p>
                <p className="text-sm text-muted-foreground">Total pets</p>
              </div>
            </CardContent>
          </Card>
        )}

        {features.interests && (
          <Card>
            <CardHeader>
              <CardTitle>Interests</CardTitle>
              <CardDescription>Community interests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{interestsCount || 0}</p>
                <p className="text-sm text-muted-foreground">Total interests</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
