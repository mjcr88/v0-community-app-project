import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsTabs } from "@/components/settings-tabs"
import { ProfileEditForm } from "./profile-edit-form"

export default async function ProfileSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: resident, error: residentError } = await supabase
    .from("users")
    .select(
      `
      *,
      user_interests (
        interest_id,
        interests (
          id,
          name
        )
      ),
      user_skills (
        skill_id,
        open_to_requests,
        skills (
          id,
          name
        )
      )
    `,
    )
    .eq("id", user.id)
    .eq("role", "resident")
    .maybeSingle()

  if (!resident) {
    // Check if user is a super admin
    const { data: superAdmin } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .eq("role", "super_admin")
      .maybeSingle()

    if (superAdmin) {
      // Super admin without resident profile - redirect to admin dashboard
      redirect(`/t/${slug}/admin/dashboard`)
    } else {
      // Regular user without resident profile - redirect to login
      redirect(`/t/${slug}/login`)
    }
  }

  // Get tenant to check features
  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", resident.tenant_id).single()

  // Get available interests for this tenant
  const { data: availableInterests } = await supabase
    .from("interests")
    .select(`
      *,
      user_interests(count)
    `)
    .eq("tenant_id", resident.tenant_id)
    .order("name")

  const { data: availableSkills } = await supabase
    .from("skills")
    .select(`
      *,
      user_skills(count)
    `)
    .eq("tenant_id", resident.tenant_id)
    .order("name")

  return (
    <>
      <SettingsTabs tenantSlug={slug} />
      <ProfileEditForm
        resident={resident}
        tenant={tenant}
        availableInterests={availableInterests || []}
        availableSkills={availableSkills || []}
        tenantSlug={slug}
      />
    </>
  )
}
