import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import EditLotForm from "./edit-lot-form"

export default async function EditLotPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
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

  // Get the lot
  const { data: lot } = await supabase
    .from("lots")
    .select(`
      *,
      neighborhoods:neighborhood_id (
        id,
        name,
        tenant_id
      )
    `)
    .eq("id", id)
    .single()

  if (!lot || lot.neighborhoods?.tenant_id !== tenant.id) {
    redirect(`/t/${slug}/admin/lots`)
  }

  // Get all neighborhoods for this tenant
  const { data: neighborhoods } = await supabase
    .from("neighborhoods")
    .select("id, name")
    .eq("tenant_id", tenant.id)
    .order("name")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Lot</h2>
        <p className="text-muted-foreground">Update lot information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lot Details</CardTitle>
          <CardDescription>Modify the lot information</CardDescription>
        </CardHeader>
        <CardContent>
          <EditLotForm slug={slug} lot={lot} neighborhoods={neighborhoods || []} />
        </CardContent>
      </Card>
    </div>
  )
}
