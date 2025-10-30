import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { WelcomeForm } from "./welcome-form"

export default async function WelcomePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: superAdmin } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  const isSuperAdmin = superAdmin?.role === "super_admin"

  // Get tenant info
  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect(`/t/${slug}/login`)
  }

  if (isSuperAdmin) {
    const mockResident = {
      id: "test-resident-id",
      first_name: "Test",
      last_name: "Admin",
      email: user.email || "admin@test.com",
    }

    return (
      <WelcomeForm
        tenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          features: tenant.features,
        }}
        resident={mockResident}
      />
    )
  }

  // For regular users, get their resident record
  const { data: resident } = await supabase
    .from("residents")
    .select("*, tenants:tenant_id(id, name, slug, features)")
    .eq("auth_user_id", user.id)
    .single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  return <WelcomeForm tenant={resident.tenants} resident={resident} />
}
