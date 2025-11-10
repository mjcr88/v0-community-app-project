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

  revalidatePath(`/admin/events/categories`, "layout")
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

  const { data: existingCategory, error: fetchError } = await supabase
    .from("event_categories")
    .select("id, tenant_id")
    .eq("id", categoryId)
    .single()

  if (fetchError || !existingCategory) {
    console.error("[v0] Error fetching event category:", fetchError)
    throw new Error("Category not found or access denied")
  }

  const { error: updateError } = await supabase
    .from("event_categories")
    .update({
      name: data.name,
      description: data.description || null,
      icon: data.icon || null,
      tenant_id: existingCategory.tenant_id,
    })
    .eq("id", categoryId)

  if (updateError) {
    console.error("[v0] Error updating event category:", updateError)
    throw new Error(updateError.message)
  }

  const { data: updatedCategory, error: selectError } = await supabase
    .from("event_categories")
    .select("*")
    .eq("id", categoryId)
    .single()

  if (selectError) {
    console.error("[v0] Error fetching updated category:", selectError)
    revalidatePath(`/admin/events/categories`, "layout")
    return { id: categoryId, ...data, tenant_id: existingCategory.tenant_id }
  }

  revalidatePath(`/admin/events/categories`, "layout")
  return updatedCategory
}

export async function deleteEventCategory(categoryId: string) {
  const supabase = await createServerClient()

  // This check will be re-added in Sprint 3 when events are fully implemented
  // For now, categories can be deleted freely during Sprint 2 setup phase

  const { error } = await supabase.from("event_categories").delete().eq("id", categoryId)

  if (error) {
    console.error("[v0] Error deleting event category:", error)
    throw new Error(error.message)
  }

  revalidatePath(`/admin/events/categories`, "layout")
}
