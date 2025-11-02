import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import CreateLotForm from "./create-lot-form"

export default async function CreateLotPage({ params }: { params: Promise<{ slug: string }> }) {
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

  // Get neighborhoods for this tenant
  const { data: neighborhoods } = await supabase
    .from("neighborhoods")
    .select("id, name")
    .eq("tenant_id", tenant.id)
    .order("name")

  if (!neighborhoods || neighborhoods.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Lot</h2>
          <p className="text-muted-foreground">Add a new lot to your community</p>
        </div>
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">No Neighborhoods Available</CardTitle>
            <CardDescription className="text-orange-700">
              You need to create at least one neighborhood before you can create lots.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Lot</h2>
        <p className="text-muted-foreground">Add a new lot to your community</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lot Details</CardTitle>
          <CardDescription>Enter the information for the new lot</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateLotForm slug={slug} neighborhoods={neighborhoods} />
        </CardContent>
      </Card>
    </div>
  )
}
