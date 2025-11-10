"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createEventCategory(
  tenantId: string,
  data: {
    name: string
    description?: string
    icon?: string
  },
) {
  const supabase = await createServerClient()

  const { data: category, error } = await supabase
    .from("event_categories")
    .insert({
      tenant_id: tenantId,
      name: data.name,
      description: data.description || null,
      icon: data.icon || null,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating event category:", error)
    throw new Error(error.message)
  }

  revalidatePath(`/t/[slug]/admin/events/categories`, "page")
  return category
}

export async function updateEventCategory(
  categoryId: string,
  data: {
    name: string
    description?: string
    icon?: string
  },
) {
  const supabase = await createServerClient()

  const { data: category, error } = await supabase
    .from("event_categories")
    .update({
      name: data.name,
      description: data.description || null,
      icon: data.icon || null,
    })
    .eq("id", categoryId)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error updating event category:", error)
    throw new Error(error.message)
  }

  revalidatePath(`/t/[slug]/admin/events/categories`, "page")
  return category
}

export async function deleteEventCategory(categoryId: string) {
  const supabase = await createServerClient()

  // Check if any events use this category
  const { count } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId)

  if (count && count > 0) {
    throw new Error(`Cannot delete category: ${count} events are using this category`)
  }

  const { error } = await supabase.from("event_categories").delete().eq("id", categoryId)

  if (error) {
    console.error("[v0] Error deleting event category:", error)
    throw new Error(error.message)
  }

  revalidatePath(`/t/[slug]/admin/events/categories`, "page")
}
