import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CompleteForm } from "./complete-form"

export default async function CompletePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  // Check if user is super admin (testing mode)
  const { data: superAdminCheck } = await supabase.from("users").select("role").eq("id", user.id).single()

  const isSuperAdmin = superAdminCheck?.role === "super_admin"

  // Fetch tenant
  const { data: tenant } = await supabase.from("tenants").select("id, name, slug").eq("slug", slug).single()

  if (!tenant) {
    redirect("/")
  }

  // Fetch resident data
  let resident

  if (isSuperAdmin) {
    resident = { id: "test-resident-id", first_name: "Test", last_name: "Admin" }
  } else {
    const { data: residentData } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("id", user.id)
      .eq("tenant_id", tenant.id)
      .in("role", ["resident", "tenant_admin"])
      .single()

    resident = residentData
  }

  if (!resident) {
    redirect(`/t/${slug}/onboarding/welcome`)
  }

  return <CompleteForm tenant={tenant} resident={resident} isSuperAdmin={isSuperAdmin} />
}
