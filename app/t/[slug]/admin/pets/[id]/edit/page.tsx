import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EditPetForm from "./edit-pet-form"

export default async function EditPetPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
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

  const { data: pet } = await supabase
    .from("pets")
    .select(
      `
      *,
      lots:lot_id (
        id,
        lot_number,
        neighborhoods:neighborhood_id (
          id,
          name,
          tenant_id
        )
      ),
      family_units:family_unit_id (
        id,
        name
      )
    `,
    )
    .eq("id", id)
    .single()

  if (!pet || pet.lots?.neighborhoods?.tenant_id !== tenant.id) {
    redirect(`/t/${slug}/admin/residents`)
  }

  const { data: lots } = await supabase
    .from("lots")
    .select(
      `
      *,
      neighborhoods:neighborhood_id (
        id,
        name,
        tenant_id
      )
    `,
    )
    .eq("neighborhoods.tenant_id", tenant.id)

  const { data: familyUnits } = await supabase.from("family_units").select("*").eq("tenant_id", tenant.id)

  return <EditPetForm pet={pet} lots={lots || []} familyUnits={familyUnits || []} slug={slug} />
}
