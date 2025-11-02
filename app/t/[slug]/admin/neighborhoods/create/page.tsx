import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import CreateNeighborhoodForm from "./create-neighborhood-form"

export default async function CreateNeighborhoodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  // Get tenant
  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect("/backoffice/login")
  }

  // Check current neighborhood count
  const { count } = await supabase
    .from("neighborhoods")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)

  const neighborhoodCount = count || 0

  // Redirect if at limit
  if (neighborhoodCount >= tenant.max_neighborhoods) {
    redirect(`/t/${slug}/admin/neighborhoods`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Neighborhood</h2>
        <p className="text-muted-foreground">
          Add a new neighborhood to your community ({neighborhoodCount} / {tenant.max_neighborhoods})
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neighborhood Details</CardTitle>
          <CardDescription>Enter the information for the new neighborhood</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateNeighborhoodForm slug={slug} tenantId={tenant.id} />
        </CardContent>
      </Card>
    </div>
  )
}
