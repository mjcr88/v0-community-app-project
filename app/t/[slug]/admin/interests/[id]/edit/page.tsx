import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EditInterestForm } from "./edit-interest-form"

export default async function EditInterestPage({
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

  const { data: interest } = await supabase
    .from("interests")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!interest) {
    redirect(`/t/${slug}/admin/interests`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Interest</h2>
        <p className="text-muted-foreground">Update interest information</p>
      </div>
      <EditInterestForm slug={slug} interest={interest} />
    </div>
  )
}
