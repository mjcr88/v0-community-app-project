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

  const { data: resident } = await supabase
    .from("users")
    .select("*")
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

  // Get or create privacy settings
  let { data: privacySettings } = await supabase
    .from("user_privacy_settings")
    .select("*")
    .eq("user_id", resident.id)
    .maybeSingle()

  // If no privacy settings exist, create default ones
  if (!privacySettings) {
    const { data: newSettings } = await supabase
      .from("user_privacy_settings")
      .insert({ user_id: resident.id })
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
