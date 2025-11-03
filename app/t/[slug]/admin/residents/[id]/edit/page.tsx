import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EditResidentForm } from "./edit-resident-form"

export default async function EditResidentPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
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

  // Get resident - allow residents without lots
  const { data: resident } = await supabase
    .from("users")
    .select(`
      *,
      lots:lot_id (
        id,
        lot_number,
        neighborhoods:neighborhood_id (
          id,
          name,
          tenant_id
        )
      )
    `)
    .eq("id", id)
    .eq("role", "resident")
    .single()

  if (!resident || resident.tenant_id !== tenant.id) {
    redirect(`/t/${slug}/admin/residents`)
  }

  // Get all lots for this tenant
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

  const { data: familyUnits } = await supabase
    .from("family_units")
    .select("id, name, primary_contact_id")
    .eq("tenant_id", tenant.id)
    .order("name")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Resident</h2>
        <p className="text-muted-foreground">Update resident information</p>
      </div>
      <EditResidentForm slug={slug} resident={resident} lots={filteredLots} familyUnits={familyUnits || []} />
    </div>
  )
}
