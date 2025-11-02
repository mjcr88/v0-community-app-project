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

  const { data: superAdminCheck } = await supabase.from("users").select("role").eq("id", user.id).single()

  const isSuperAdmin = superAdminCheck?.role === "super_admin"

  const { data: tenant } = await supabase.from("tenants").select("id, name, slug").eq("slug", slug).single()

  if (!tenant) {
    redirect("/")
  }

  const { data: interests } = await supabase
    .from("interests")
    .select(`
      id, 
      name, 
      description,
      user_interests(count)
    `)
    .eq("tenant_id", tenant.id)
    .order("name")

  // Transform to include user_count
  const interestsWithCounts =
    interests?.map((interest) => ({
      id: interest.id,
      name: interest.name,
      description: interest.description,
      user_count: interest.user_interests?.[0]?.count || 0,
    })) || []

  let resident
  let residentInterests: string[] = []

  if (isSuperAdmin) {
    resident = { id: "test-resident-id" }
  } else {
    const { data: residentData } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .eq("tenant_id", tenant.id)
      .eq("role", "resident")
      .single()

    resident = residentData

    if (resident) {
      const { data: existingInterests } = await supabase
        .from("user_interests")
        .select("interest_id")
        .eq("user_id", resident.id)

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
      interests={interestsWithCounts}
      residentInterests={residentInterests}
      isSuperAdmin={isSuperAdmin}
    />
  )
}
