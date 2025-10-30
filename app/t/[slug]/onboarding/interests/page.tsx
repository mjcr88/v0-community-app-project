import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InterestsForm } from "./interests-form"

export default async function InterestsPage({ params }: { params: Promise<{ slug: string }> }) {
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

  const { data: interests } = await supabase
    .from("interests")
    .select("id, name, description")
    .eq("tenant_id", tenant.id)
    .order("name")

  // Fetch resident data
  let resident
  let residentInterests: string[] = []

  if (isSuperAdmin) {
    resident = { id: "test-resident-id" }
  } else {
    const { data: residentData } = await supabase
      .from("residents")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("tenant_id", tenant.id)
      .single()

    resident = residentData

    if (resident) {
      // Fetch existing interests
      const { data: existingInterests } = await supabase
        .from("resident_interests")
        .select("interest_id")
        .eq("resident_id", resident.id)

      residentInterests = existingInterests?.map((i) => i.interest_id) || []
    }
  }

  if (!resident) {
    redirect(`/t/${slug}/onboarding/welcome`)
  }

  return (
    <InterestsForm
      tenant={tenant}
      resident={resident}
      interests={interests || []}
      residentInterests={residentInterests}
      isSuperAdmin={isSuperAdmin}
    />
  )
}
