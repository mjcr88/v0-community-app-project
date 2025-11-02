import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { JourneyForm } from "./journey-form"

export default async function JourneyPage({ params }: { params: Promise<{ slug: string }> }) {
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

  // Fetch or create mock resident data
  let resident
  if (isSuperAdmin) {
    resident = {
      id: "test-resident-id",
      journey_stage: null,
      estimated_move_in_date: null,
    }
  } else {
    const { data: residentData } = await supabase
      .from("users")
      .select("id, journey_stage, estimated_move_in_date")
      .eq("id", user.id)
      .eq("tenant_id", tenant.id)
      .eq("role", "resident")
      .single()

    resident = residentData
  }

  if (!resident) {
    redirect(`/t/${slug}/onboarding/welcome`)
  }

  return <JourneyForm tenant={tenant} resident={resident} isSuperAdmin={isSuperAdmin} />
}
