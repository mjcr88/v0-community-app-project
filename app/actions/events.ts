"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createEvent(
  tenantId: string,
  data: {
    title: string
    description: string | null
    category_id: string
    event_type: "in_person" | "virtual" | "hybrid"
    start_datetime: string
    end_datetime: string | null
    visibility_scope: "community" | "neighborhood" | "private"
    status: "draft" | "published" | "cancelled"
  },
) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      tenant_id: tenantId,
      created_by: user.id,
      title: data.title,
      description: data.description,
      category_id: data.category_id,
      event_type: data.event_type,
      start_datetime: data.start_datetime,
      end_datetime: data.end_datetime,
      visibility_scope: data.visibility_scope,
      status: data.status,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating event:", error)
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/events`, "layout")
  return event
}
