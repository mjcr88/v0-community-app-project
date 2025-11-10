import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsForm } from "./settings-form"

export default async function AdminSettingsPage({
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

  // Get tenant info
  const { data: tenant, error } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (error || !tenant) {
    redirect(`/t/${slug}/dashboard`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage community features and configuration</p>
      </div>

      <SettingsForm tenant={tenant} />
    </div>
  )
}
