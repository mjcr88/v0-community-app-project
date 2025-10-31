import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsTabs } from "@/components/settings-tabs"
import { PrivacySettingsForm } from "./privacy-settings-form"

export default async function PrivacySettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: resident } = await supabase.from("residents").select("*").eq("auth_user_id", user.id).single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  // Get or create privacy settings
  let { data: privacySettings } = await supabase
    .from("resident_privacy_settings")
    .select("*")
    .eq("resident_id", resident.id)
    .maybeSingle()

  // If no privacy settings exist, create default ones
  if (!privacySettings) {
    const { data: newSettings } = await supabase
      .from("resident_privacy_settings")
      .insert({ resident_id: resident.id })
      .select()
      .single()
    privacySettings = newSettings
  }

  return (
    <>
      <SettingsTabs tenantSlug={slug} />
      <PrivacySettingsForm privacySettings={privacySettings} tenantSlug={slug} />
    </>
  )
}
