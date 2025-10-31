import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, MapPin } from "lucide-react"

export default async function ResidentDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get resident info with related data
  const { data: resident } = await supabase
    .from("users")
    .select(
      `
      *,
      lots (
        lot_number,
        neighborhoods (
          name
        )
      )
    `,
    )
    .eq("auth_user_id", user.id)
    .eq("role", "resident")
    .single()

  // Get total residents count in tenant
  const { count: totalResidents } = await supabase
    .from("users")
    .select("*", { count: "only", head: true })
    .eq("tenant_id", resident.tenant_id)
    .eq("role", "resident")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {resident.first_name || "Resident"}!</h2>
        <p className="text-muted-foreground">Here's what's happening in your community</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
            <div className="text-2xl font-bold">{totalResidents || 0}</div>
            <p className="text-xs text-muted-foreground">Total residents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Journey Stage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{resident.journey_stage || "Not set"}</div>
            <p className="text-xs text-muted-foreground">
              {resident.estimated_move_in_date
                ? `Moving ${new Date(resident.estimated_move_in_date).toLocaleDateString()}`
                : "No date set"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with your community dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Explore your neighbours, update your profile, or manage your privacy settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
