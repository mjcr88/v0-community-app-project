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

  // Check if privacy settings exist
  const { data: existingSettings } = await supabase
    .from("user_privacy_settings")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

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
    show_profile_picture: settings.showProfilePicture,
    show_neighborhood: settings.showNeighborhood,
    show_family: settings.showFamily,
    show_family_relationships: settings.showFamilyRelationships,
    show_interests: settings.showInterests,
    show_skills: settings.showSkills,
    show_open_to_requests: settings.showOpenToRequests,
  }

  if (existingSettings) {
    // Update existing settings
    const { error } = await supabase.from("user_privacy_settings").update(privacyData).eq("user_id", user.id)

    if (error) {
      console.error("[v0] Error updating privacy settings:", error)
      return { success: false, error: error.message }
    }
  } else {
    // Insert new settings
    const { error } = await supabase.from("user_privacy_settings").insert(privacyData)

    if (error) {
      console.error("[v0] Error inserting privacy settings:", error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath(`/t/${tenantSlug}/dashboard/settings/privacy`)
  revalidatePath(`/t/${tenantSlug}/dashboard/neighbours`)

  return { success: true }
}
