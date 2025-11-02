import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CreateFamilyForm from "./create-family-form"

export default async function CreateFamilyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
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

  const { data: lots } = await supabase
    .from("lots")
    .select(`
      id,
      lot_number,
      neighborhoods:neighborhood_id (
        name
      )
    `)
    .order("lot_number")

  const { data: existingResidents } = await supabase
    .from("residents")
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      lots:lot_id (
        lot_number
      )
    `)
    .order("first_name")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create Family Unit</h2>
        <p className="text-muted-foreground">Create a new family unit with multiple members and optional pets</p>
      </div>

      <CreateFamilyForm
        slug={slug}
        tenantId={tenant.id}
        lots={lots || []}
        existingResidents={existingResidents || []}
      />
    </div>
  )
}
