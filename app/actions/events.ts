"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createEvent(
  tenantSlug: string,
  tenantId: string,
  data: {
    title: string
    description: string | null
    category_id: string
    event_type: "resident" | "official"
    start_date: string
    start_time: string | null
    end_date: string | null
    end_time: string | null
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

  const endDate = data.end_date || data.start_date

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      tenant_id: tenantId,
      created_by: user.id,
      title: data.title,
      description: data.description,
      category_id: data.category_id,
      event_type: data.event_type,
      start_date: data.start_date,
      start_time: data.start_time,
      end_date: endDate,
      end_time: data.end_time,
      visibility_scope: data.visibility_scope,
      status: data.status,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating event:", error)
    throw new Error(error.message)
  }

  revalidatePath(`/t/${tenantSlug}/dashboard/events`, "layout")
  return event
}
