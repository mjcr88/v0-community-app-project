import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreateInterestForm } from "./create-interest-form"

export default async function CreateInterestPage({
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create Interest</h2>
        <p className="text-muted-foreground">Add a new interest for residents to select</p>
      </div>
      <CreateInterestForm slug={slug} tenantId={tenant.id} />
    </div>
  )
}
