import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileEditForm } from "./profile-edit-form"
import { SettingsLayout } from "@/components/settings/settings-layout"

export default async function ProfileSettingsPage({
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

  const { data: resident } = await supabase
    .from("users")
    .select(
      `
      *,
      user_interests (
        interest_id
      ),
      user_skills (
        skill_id,
        skills (
          name
        ),
        open_to_requests
      ),
      lots (
        lot_number,
        neighborhoods (
          name
        )
      )
    `,
    )
    .eq("id", user.id)
    .single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", resident.tenant_id).single()

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

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .eq("tenant_id", resident.tenant_id)
    .order("name")

  return (
    <SettingsLayout tenantSlug={slug} title="Profile Settings" description="Manage your personal information and public profile">
      <ProfileEditForm
        resident={resident}
        tenant={tenant}
        availableInterests={availableInterests || []}
        availableSkills={availableSkills || []}
        tenantSlug={slug}
        locations={locations || []}
      />
    </SettingsLayout>
  )
}
