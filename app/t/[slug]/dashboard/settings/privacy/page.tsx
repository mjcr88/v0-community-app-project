import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PrivacySettingsForm } from "./privacy-settings-form"
import { SettingsLayout } from "@/components/settings/settings-layout"

export default async function PrivacySettingsPage({
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

  // Get current resident
  const { data: resident } = await supabase.from("users").select("id, tenant_id").eq("id", user.id).single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  // Get privacy settings
  let { data: privacySettings } = await supabase
    .from("user_privacy_settings")
    .select("*")
    .eq("user_id", resident.id)
    .single()

  // If no settings exist, create default
  if (!privacySettings) {
    const { data: newSettings } = await supabase
      .from("user_privacy_settings")
      .insert({ user_id: resident.id })
      .select()
      .single()
    privacySettings = newSettings
  }

  return (
    <SettingsLayout tenantSlug={slug} title="Privacy Settings" description="Control what information is visible to others">
      <PrivacySettingsForm privacySettings={privacySettings} tenantSlug={slug} />
    </SettingsLayout>
  )
}
