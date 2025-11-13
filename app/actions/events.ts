"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/database.types"

type Event = Database["public"]["Tables"]["events"]["Row"]
type EventInsert = Database["public"]["Tables"]["events"]["Insert"]
type EventUpdate = Database["public"]["Tables"]["events"]["Update"]

export async function getEvents(tenantId: string, filters?: { categoryId?: string; status?: string }) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("events")
      .select(`
        *,
        category:event_categories(id, name, color),
        creator:users!events_created_by_user_id_fkey(id, first_name, last_name),
        location:locations!location_id(id, name, coordinates)
      `)
      .eq("tenant_id", tenantId)
      .in("status", ["published", "cancelled"])
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true })

    if (filters?.categoryId) {
      query = query.eq("category_id", filters.categoryId)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching events:", error)
      return { success: false, events: [], error: error.message }
    }

    // Get RSVP counts and flag counts for each event
    const eventsWithCounts = await Promise.all(
      (data || []).map(async (event) => {
        const [rsvpResult, flagResult] = await Promise.all([
          supabase.rpc("get_event_rsvp_counts", { event_id_input: event.id }),
          supabase.rpc("get_event_flag_count", { event_id_input: event.id }),
        ])

        return {
          ...event,
          rsvp_counts: rsvpResult.data || { going: 0, interested: 0, not_going: 0 },
          flag_count: flagResult.data || 0,
        }
      }),
    )

    return { success: true, events: eventsWithCounts, error: null }
  } catch (error) {
    console.error("[v0] Unexpected error fetching events:", error)
    return { success: false, events: [], error: "An unexpected error occurred" }
  }
}

export async function getEvent(eventId: string, tenantId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        category:event_categories(id, name, color),
        creator:users!events_created_by_user_id_fkey(id, first_name, last_name, profile_image_url),
        location:locations!location_id(id, name, type, coordinates, description, amenities, photos, hero_photo)
      `)
      .eq("id", eventId)
      .eq("tenant_id", tenantId)
      .single()

    if (error) {
      console.error("[v0] Error fetching event:", error)
      return { success: false, event: null, error: error.message }
    }

    // Get RSVP counts, flag count, and user's RSVP status
    const [rsvpResult, flagResult, userRsvpResult] = await Promise.all([
      supabase.rpc("get_event_rsvp_counts", { event_id_input: eventId }),
      supabase.rpc("get_event_flag_count", { event_id_input: eventId }),
      user
        ? supabase.from("event_rsvps").select("status").eq("event_id", eventId).eq("user_id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    const eventWithDetails = {
      ...data,
      rsvp_counts: rsvpResult.data || { going: 0, interested: 0, not_going: 0 },
      flag_count: flagResult.data || 0,
      user_rsvp_status: userRsvpResult.data?.status || null,
    }

    return { success: true, event: eventWithDetails, error: null }
  } catch (error) {
    console.error("[v0] Unexpected error fetching event:", error)
    return { success: false, event: null, error: "An unexpected error occurred" }
  }
}

export async function createEvent(
  tenantSlug: string,
  data: EventInsert & {
    neighborhood_ids?: string[]
    invitee_ids?: string[]
    family_unit_ids?: string[]
  },
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, event: null, error: "Unauthorized" }
    }

    const { neighborhood_ids, invitee_ids, family_unit_ids, ...eventData } = data

    const { data: newEvent, error } = await supabase
      .from("events")
      .insert({
        ...eventData,
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating event:", error)
      return { success: false, event: null, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    return { success: true, event: newEvent, error: null }
  } catch (error) {
    console.error("[v0] Unexpected error creating event:", error)
    return { success: false, event: null, error: "An unexpected error occurred" }
  }
}

export async function updateEvent(
  eventId: string,
  tenantSlug: string,
  data: Partial<EventUpdate> & {
    neighborhood_ids?: string[]
    invitee_ids?: string[]
    family_unit_ids?: string[]
  },
) {
  try {
    const supabase = await createClient()

    const { neighborhood_ids, invitee_ids, family_unit_ids, ...eventData } = data

    const { error } = await supabase.from("events").update(eventData).eq("id", eventId)

    if (error) {
      console.error("[v0] Error updating event:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events/${eventId}`)
    return { success: true, error: null }
  } catch (error) {
    console.error("[v0] Unexpected error updating event:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deleteEvent(eventId: string, tenantSlug: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("events").delete().eq("id", eventId)

    if (error) {
      console.error("[v0] Error deleting event:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    return { success: true, error: null }
  } catch (error) {
    console.error("[v0] Unexpected error deleting event:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function rsvpToEvent(eventId: string, tenantId: string, status: "going" | "interested" | "not_going") {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    const { data: existingRsvp } = await supabase
      .from("event_rsvps")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingRsvp) {
      const { error } = await supabase.from("event_rsvps").update({ status }).eq("id", existingRsvp.id)

      if (error) {
        console.error("[v0] Error updating RSVP:", error)
        return { success: false, error: error.message }
      }
    } else {
      const { error } = await supabase.from("event_rsvps").insert({
        event_id: eventId,
        user_id: user.id,
        tenant_id: tenantId,
        status,
      })

      if (error) {
        console.error("[v0] Error creating RSVP:", error)
        return { success: false, error: error.message }
      }
    }

    revalidatePath(`/t/[slug]/dashboard/events/${eventId}`)
    return { success: true, error: null }
  } catch (error) {
    console.error("[v0] Unexpected error RSVPing to event:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getUpcomingEvents(tenantId: string, limit?: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, events: [], error: "Unauthorized" }
    }

    const today = new Date().toISOString().split("T")[0]

    let query = supabase
      .from("events")
      .select(`
        id,
        title,
        start_date,
        start_time,
        end_date,
        end_time,
        is_all_day,
        status,
        category:event_categories(id, name, color),
        location:locations!location_id(id, name)
      `)
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching upcoming events:", error)
      return { success: false, events: [], error: error.message }
    }

    // Get RSVP and flag counts
    const eventsWithCounts = await Promise.all(
      (data || []).map(async (event) => {
        const [rsvpResult, flagResult] = await Promise.all([
          supabase.rpc("get_event_rsvp_counts", { event_id_input: event.id }),
          supabase.rpc("get_event_flag_count", { event_id_input: event.id }),
        ])

        return {
          ...event,
          rsvp_counts: rsvpResult.data || { going: 0, interested: 0, not_going: 0 },
          flag_count: flagResult.data || 0,
        }
      }),
    )

    return { success: true, events: eventsWithCounts, error: null }
  } catch (error) {
    console.error("[v0] Unexpected error fetching upcoming events:", error)
    return { success: false, events: [], error: "An unexpected error occurred" }
  }
}

export async function flagEvent(eventId: string, tenantSlug: string, reason: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if user already flagged this event
    const { data: existingFlag } = await supabase
      .from("event_flags")
      .select("id")
      .eq("event_id", eventId)
      .eq("reported_by_user_id", user.id)
      .maybeSingle()

    if (existingFlag) {
      return { success: false, error: "You have already flagged this event" }
    }

    const { error } = await supabase.from("event_flags").insert({
      event_id: eventId,
      reported_by_user_id: user.id,
      reason,
      status: "pending",
    })

    if (error) {
      console.error("[v0] Error flagging event:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/events/${eventId}`)
    revalidatePath(`/t/${tenantSlug}/admin/events`)
    return { success: true, error: null }
  } catch (error) {
    console.error("[v0] Unexpected error flagging event:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function dismissEventFlag(flagId: string, tenantSlug: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("event_flags").update({ status: "dismissed" }).eq("id", flagId)

    if (error) {
      console.error("[v0] Error dismissing flag:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/admin/events`)
    return { success: true, error: null }
  } catch (error) {
    console.error("[v0] Unexpected error dismissing flag:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function cancelEvent(eventId: string, tenantSlug: string, cancellationReason: string, uncancel = false) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    const updateData: any = {
      status: uncancel ? "published" : "cancelled",
      cancellation_reason: uncancel ? null : cancellationReason,
      cancelled_at: uncancel ? null : new Date().toISOString(),
      cancelled_by: uncancel ? null : user.id,
    }

    const { error } = await supabase.from("events").update(updateData).eq("id", eventId)

    if (error) {
      console.error("[v0] Error cancelling event:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events/${eventId}`)
    return { success: true, error: null }
  } catch (error) {
    console.error("[v0] Unexpected error cancelling event:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getEventsByLocation(locationId: string, tenantId: string) {
  try {
    const supabase = await createClient()

    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        category:event_categories(id, name, color),
        creator:users!events_created_by_user_id_fkey(id, first_name, last_name),
        location:locations!location_id(id, name)
      `)
      .eq("location_id", locationId)
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching events by location:", error)
      return { success: false, events: [], error: error.message }
    }

    // Get RSVP and flag counts
    const eventsWithCounts = await Promise.all(
      (data || []).map(async (event) => {
        const [rsvpResult, flagResult] = await Promise.all([
          supabase.rpc("get_event_rsvp_counts", { event_id_input: event.id }),
          supabase.rpc("get_event_flag_count", { event_id_input: event.id }),
        ])

        return {
          ...event,
          rsvp_counts: rsvpResult.data || { going: 0, interested: 0, not_going: 0 },
          flag_count: flagResult.data || 0,
        }
      }),
    )

    return { success: true, events: eventsWithCounts, error: null }
  } catch (error) {
    console.error("[v0] Unexpected error fetching events by location:", error)
    return { success: false, events: [], error: "An unexpected error occurred" }
  }
}

export async function getLocationEventCount(locationId: string, tenantId: string): Promise<number> {
  try {
    const supabase = await createClient()

    const today = new Date().toISOString().split("T")[0]

    const { count, error } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("location_id", locationId)
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .gte("start_date", today)

    if (error) {
      console.error("[v0] Error fetching event count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("[v0] Unexpected error fetching event count:", error)
    return 0
  }
}
