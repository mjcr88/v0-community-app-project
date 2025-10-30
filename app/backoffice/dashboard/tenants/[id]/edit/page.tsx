import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EditTenantForm from "./edit-tenant-form"

export default async function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch tenant data
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select(
      `
      *,
      tenant_admin:users!tenants_tenant_admin_id_fkey(id, name, email)
    `,
    )
    .eq("id", id)
    .single()

  if (error || !tenant) {
    redirect("/backoffice/dashboard")
  }

  return <EditTenantForm tenant={tenant} />
}
