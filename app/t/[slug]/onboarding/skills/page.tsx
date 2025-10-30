import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SkillsForm } from "./skills-form"

export default async function SkillsPage({ params }: { params: Promise<{ slug: string }> }) {
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

  // Fetch skills for this tenant
  const { data: skills } = await supabase
    .from("skills")
    .select("id, name, description")
    .eq("tenant_id", tenant.id)
    .order("name")

  // Fetch resident data
  let resident
  let residentSkills: { id: string; open_to_requests: boolean }[] = []

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
      // Fetch existing skills
      const { data: existingSkills } = await supabase
        .from("resident_skills")
        .select("skill_id, open_to_requests")
        .eq("resident_id", resident.id)

      residentSkills = existingSkills?.map((s) => ({ id: s.skill_id, open_to_requests: s.open_to_requests })) || []
    }
  }

  if (!resident) {
    redirect(`/t/${slug}/onboarding/welcome`)
  }

  return (
    <SkillsForm
      tenant={tenant}
      resident={resident}
      skills={skills || []}
      residentSkills={residentSkills}
      isSuperAdmin={isSuperAdmin}
    />
  )
}
