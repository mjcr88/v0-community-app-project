"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updatePrivacySettings(tenantSlug: string, settings: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  console.log("[v0] Updating privacy settings for user:", user.id)
  console.log("[v0] Settings to save:", settings)

  // Check if privacy settings exist
  const { data: existingSettings } = await supabase
    .from("user_privacy_settings")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  console.log("[v0] Existing settings:", existingSettings)

  const privacyData = {
    user_id: user.id,
    show_email: settings.showEmail,
    show_phone: settings.showPhone,
    show_birthday: settings.showBirthday,
    show_birth_country: settings.showBirthCountry,
    show_current_country: settings.showCurrentCountry,
    show_languages: settings.showLanguages,
    show_preferred_language: settings.showPreferredLanguage,
    show_journey_stage: settings.showJourneyStage,
    show_estimated_move_in_date: settings.showEstimatedMoveInDate,
    show_family: settings.showFamily,
    show_family_relationships: settings.showFamilyRelationships,
    show_interests: settings.showInterests,
    show_skills: settings.showSkills,
    show_open_to_requests: settings.showOpenToRequests,
  }

  console.log("[v0] Privacy data to save:", privacyData)

  if (existingSettings) {
    // Update existing settings
    const { error } = await supabase.from("user_privacy_settings").update(privacyData).eq("user_id", user.id)

    if (error) {
      console.error("[v0] Error updating privacy settings:", error)
      return { success: false, error: error.message }
    }
    console.log("[v0] Privacy settings updated successfully")
  } else {
    // Insert new settings
    const { error } = await supabase.from("user_privacy_settings").insert(privacyData)

    if (error) {
      console.error("[v0] Error inserting privacy settings:", error)
      return { success: false, error: error.message }
    }
    console.log("[v0] Privacy settings inserted successfully")
  }

  revalidatePath(`/t/${tenantSlug}/dashboard/settings/privacy`)
  revalidatePath(`/t/${tenantSlug}/dashboard/neighbours`)

  return { success: true }
}
