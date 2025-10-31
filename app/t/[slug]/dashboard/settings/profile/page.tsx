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

  // Get resident data with interests and skills
  const { data: resident } = await supabase
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
        id,
        skill_name,
        open_to_requests
      )
    `,
    )
    .eq("auth_user_id", user.id)
    .single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
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
