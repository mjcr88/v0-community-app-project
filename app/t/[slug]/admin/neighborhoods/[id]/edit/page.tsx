import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import EditNeighborhoodForm from "./edit-neighborhood-form"

export default async function EditNeighborhoodPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
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

  // Get neighborhood
  const { data: neighborhood } = await supabase
    .from("neighborhoods")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!neighborhood) {
    redirect(`/t/${slug}/admin/neighborhoods`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Neighborhood</h2>
        <p className="text-muted-foreground">Update the neighborhood information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neighborhood Details</CardTitle>
          <CardDescription>Modify the information for this neighborhood</CardDescription>
        </CardHeader>
        <CardContent>
          <EditNeighborhoodForm slug={slug} neighborhood={neighborhood} />
        </CardContent>
      </Card>
    </div>
  )
}
