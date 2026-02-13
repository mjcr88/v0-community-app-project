import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreateResidentForm } from "./create-resident-form"

export default async function CreateResidentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerClient()

  // Check authentication
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

  // Get lots with neighborhood info for this tenant
  const { data: lots } = await supabase
    .from("lots")
    .select(`
      *,
      neighborhoods:neighborhood_id (
        id,
        name,
        tenant_id
      )
    `)
    .eq("neighborhoods.tenant_id", tenant.id)
    .order("lot_number")

  const filteredLots = lots?.filter((l: any) => l.neighborhoods?.tenant_id === tenant.id) || []

  if (filteredLots.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Resident</h2>
          <p className="text-muted-foreground">Add a new resident to your community</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">You need to create at least one lot before you can add residents.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create Resident</h2>
        <p className="text-muted-foreground">Add a new resident to your community</p>
      </div>
      <CreateResidentForm slug={slug} tenantId={tenant.id} lots={filteredLots} />
    </div>
  )
}
