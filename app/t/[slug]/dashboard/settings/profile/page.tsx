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
    .from("residents")
    .select(
      `
      *,
      resident_interests (
        interest_id,
        interests (
          id,
          name
        )
      ),
      resident_skills (
        skill_name,
        open_to_requests
      )
    `,
    )
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (!resident) {
    // Check if user is a super admin
    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("id")
      .eq("auth_user_id", user.id)
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
    .select("*")
    .eq("tenant_id", resident.tenant_id)
    .order("name")

  return (
    <>
      <SettingsTabs tenantSlug={slug} />
      <ProfileEditForm
        resident={resident}
        tenant={tenant}
        availableInterests={availableInterests || []}
        tenantSlug={slug}
      />
    </>
  )
}
