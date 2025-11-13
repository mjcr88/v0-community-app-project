"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Seeds default event categories for a tenant when events are enabled
 */
export async function seedEventCategories(tenantId: string) {
  const supabase = await createServerClient()

  const defaultCategories = [
    { name: "Social", description: "Social gatherings and community bonding activities", icon: "🎉" },
    { name: "Maintenance", description: "Property maintenance and improvement activities", icon: "🔧" },
    { name: "Educational", description: "Learning workshops and educational sessions", icon: "📚" },
    { name: "Sports", description: "Sports activities and fitness events", icon: "🏆" },
    { name: "Community Meeting", description: "Official community meetings and discussions", icon: "💬" },
    { name: "Celebration", description: "Special occasions and celebrations", icon: "🎊" },
  ]

  // Check which categories already exist
  const { data: existingCategories } = await supabase.from("event_categories").select("name").eq("tenant_id", tenantId)

  const existingNames = new Set(existingCategories?.map((c) => c.name) || [])

  // Insert only categories that don't exist
  const categoriesToInsert = defaultCategories
    .filter((cat) => !existingNames.has(cat.name))
    .map((cat) => ({
      tenant_id: tenantId,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
    }))

  if (categoriesToInsert.length > 0) {
    const { error } = await supabase.from("event_categories").insert(categoriesToInsert)

    if (error) {
      console.error("[v0] Error seeding categories:", error)
      throw new Error(error.message)
    }
  }

  return { seeded: categoriesToInsert.length }
}

/**
 * Toggle events feature for a tenant and seed categories if enabled
 */
export async function toggleEventsFeature(tenantId: string, enabled: boolean) {
  const supabase = await createServerClient()

  const { error } = await supabase.from("tenants").update({ events_enabled: enabled }).eq("id", tenantId)

  if (error) {
    console.error("[v0] Error toggling events feature:", error)
    throw new Error(error.message)
  }

  // If enabling events, seed default categories
  if (enabled) {
    await seedEventCategories(tenantId)
  }

  revalidatePath("/backoffice/dashboard/tenants", "layout")
  return { success: true }
}

/**
 * Toggle check-ins feature for a tenant
 */
export async function toggleCheckInsFeature(tenantId: string, enabled: boolean) {
  const supabase = await createServerClient()

  const { error } = await supabase.from("tenants").update({ checkins_enabled: enabled }).eq("id", tenantId)

  if (error) {
    console.error("[v0] Error toggling check-ins feature:", error)
    throw new Error(error.message)
  }

  revalidatePath("/backoffice/dashboard/tenants", "layout")
  return { success: true }
}
