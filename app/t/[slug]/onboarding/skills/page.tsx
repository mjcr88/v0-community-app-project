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

  const { data: superAdminCheck } = await supabase.from("users").select("role").eq("id", user.id).single()

  const isSuperAdmin = superAdminCheck?.role === "super_admin"

  const { data: tenant } = await supabase.from("tenants").select("id, name, slug").eq("slug", slug).single()

  if (!tenant) {
    redirect("/")
  }

  const { data: skills } = await supabase
    .from("skills")
    .select(`
      id, 
      name, 
      description,
      user_skills(count)
    `)
    .eq("tenant_id", tenant.id)
    .order("name")

  // Transform to include user_count
  const skillsWithCounts =
    skills?.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      user_count: skill.user_skills?.[0]?.count || 0,
    })) || []

  let resident
  let residentSkills: { id: string; open_to_requests: boolean }[] = []

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
      const { data: existingSkills } = await supabase
        .from("user_skills")
        .select("skill_id, open_to_requests")
        .eq("user_id", resident.id)

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
      skills={skillsWithCounts}
      residentSkills={residentSkills}
      isSuperAdmin={isSuperAdmin}
    />
  )
}
