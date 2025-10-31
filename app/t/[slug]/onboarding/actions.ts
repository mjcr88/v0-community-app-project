"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function markOnboardingComplete() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  console.log("[v0] Marking onboarding complete for user:", user.id)

  const { error } = await supabase
    .from("users")
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    console.error("[v0] Error marking onboarding complete:", error)
    return { success: false, error: error.message }
  }

  console.log("[v0] Successfully marked onboarding as complete")

  // Revalidate to ensure fresh data
  revalidatePath("/")

  return { success: true }
}
