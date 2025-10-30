import { createServerClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { EditFamilyForm } from "./edit-family-form"

export default async function EditFamilyPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const supabase = await createServerClient()

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

  const { data: family } = await supabase
    .from("family_units")
    .select(`
      *,
      primary_contact:primary_contact_id (
        id,
        first_name,
        last_name
      )
    `)
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!family) {
    notFound()
  }

  const { data: residents } = await supabase
    .from("residents")
    .select("*")
    .eq("family_unit_id", family.id)
    .order("created_at", { ascending: true })

  const { data: pets } = await supabase
    .from("pets")
    .select("*")
    .eq("family_unit_id", family.id)
    .order("created_at", { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Family Unit</h2>
        <p className="text-muted-foreground">Update family information</p>
      </div>

      <EditFamilyForm slug={slug} family={family} residents={residents || []} pets={pets || []} />
    </div>
  )
}
