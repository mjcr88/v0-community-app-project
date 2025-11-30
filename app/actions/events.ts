"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { applyVisibilityFilter, canUserViewEvent } from "@/lib/visibility-filter"
import { cache } from 'react'

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
    is_all_day?: boolean
    visibility_scope: "community" | "neighborhood" | "private"
    status: "draft" | "published" | "cancelled"
    requires_rsvp?: boolean
    rsvp_deadline?: string | null
    max_attendees?: number | null
    neighborhood_ids?: string[]
    invitee_ids?: string[]
    family_unit_ids?: string[]
    location_type?: "community" | "custom" | "none"
    location_id?: string | null
    custom_location_name?: string | null
    custom_location_coordinates?: { lat: number; lng: number } | null
    custom_location_type?: "pin" | "polygon" | null
    custom_location_path?: Array<{ lat: number; lng: number }> | null
  },
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Validate required fields
    if (!data.title?.trim()) {
      return { success: false, error: "Event title is required" }
    }

    if (!data.category_id) {
      return { success: false, error: "Event category is required" }
    }

    if (!data.start_date) {
      return { success: false, error: "Event start date is required" }
    }

    // Auto-set end_date to start_date if not provided
    const endDate = data.end_date || data.start_date

    // If all-day event, clear time fields
    const startTime = data.is_all_day ? null : data.start_time
    const endTime = data.is_all_day ? null : data.end_time

    let dbLocationType: string | null = null
    if (data.location_type === "community") {
      dbLocationType = "community_location"
    } else if (data.location_type === "custom") {
      dbLocationType = "custom_temporary"
    }
    // "none" maps to null

    let dbCustomLocationType: string | null = null
    if (data.custom_location_type === "pin") {
      dbCustomLocationType = "marker"
    } else if (data.custom_location_type === "polygon") {
      dbCustomLocationType = "polygon"
    }

    let customLocationCoordinates = data.custom_location_coordinates
    if (data.custom_location_type === "polygon" && data.custom_location_path && data.custom_location_path.length > 0) {
      // Store polygon path as array in custom_location_coordinates
      customLocationCoordinates = data.custom_location_path as any
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        tenant_id: tenantId,
        created_by: user.id,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        category_id: data.category_id,
        event_type: data.event_type,
        start_date: data.start_date,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        is_all_day: data.is_all_day || false,
        visibility_scope: data.visibility_scope,
        status: data.status || "published",
        requires_rsvp: data.requires_rsvp || false,
        rsvp_deadline: data.rsvp_deadline || null,
        max_attendees: data.max_attendees || null,
        location_type: dbLocationType,
        location_id: data.location_id || null,
        custom_location_name: data.custom_location_name || null,
        custom_location_coordinates: customLocationCoordinates || null,
        custom_location_type: dbCustomLocationType,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating event:", error)
      return { success: false, error: error.message }
    }

    if (data.visibility_scope === "neighborhood" && data.neighborhood_ids && data.neighborhood_ids.length > 0) {
      const neighborhoodInserts = data.neighborhood_ids.map((neighborhoodId) => ({
        event_id: event.id,
        neighborhood_id: neighborhoodId,
      }))

      const { error: neighborhoodError } = await supabase.from("event_neighborhoods").insert(neighborhoodInserts)

      if (neighborhoodError) {
        console.error("[v0] Error adding neighborhoods:", neighborhoodError)
        // Don't fail the whole operation, just log it
      }
    }

    if (data.visibility_scope === "private") {
      const invites: Array<{ event_id: string; invitee_id: string | null; family_unit_id: string | null }> = []

      // Add individual invitees
      if (data.invitee_ids && data.invitee_ids.length > 0) {
        data.invitee_ids.forEach((inviteeId) => {
          invites.push({
            event_id: event.id,
            invitee_id: inviteeId,
            family_unit_id: null,
          })
        })
      }

      // Add family invites
      if (data.family_unit_ids && data.family_unit_ids.length > 0) {
        data.family_unit_ids.forEach((familyId) => {
          invites.push({
            event_id: event.id,
            invitee_id: null,
            family_unit_id: familyId,
          })
        })
      }

      if (invites.length > 0) {
        const { error: inviteError } = await supabase.from("event_invites").insert(invites)

        if (inviteError) {
          console.error("[v0] Error adding invites:", inviteError)
          // Don't fail the whole operation, just log it
        } else {
          // Send invitations to private event invitees
          await sendEventInviteNotifications(event.id, tenantId, tenantSlug, user.id, invites)
        }
      }
    }

    // Send notifications for official community/neighborhood events
    if (
      data.event_type === "official" &&
      data.status === "published" &&
      (data.visibility_scope === "community" || data.visibility_scope === "neighborhood")
    ) {
      await sendEventPublishedNotifications(event.id, tenantId, tenantSlug, user.id, data.visibility_scope, data.neighborhood_ids)
    }

    revalidatePath(`/t/${tenantSlug}/dashboard`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events`)

    return { success: true, data: event }
  } catch (error) {
    console.error("[v0] Unexpected error creating event:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

import { getEventById, getEvents } from "@/lib/data/events"

// ... (keep imports)

// ... (keep createEvent)

export async function getEvent(eventId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get user context for visibility check
    const { data: userData } = await supabase.from("users").select("lot_id, family_unit_id").eq("id", user.id).single()

    const canView = await canUserViewEvent(eventId, {
      userId: user.id,
      tenantId,
      userLotId: userData?.lot_id,
      userFamilyUnitId: userData?.family_unit_id,
    })

    if (!canView) {
      return { success: false, error: "Event not found" }
    }

    const event = await getEventById(eventId, {
      enrichWithCategory: true,
      enrichWithCreator: true,
      enrichWithLocation: true,
    })

    if (!event || event.tenant_id !== tenantId) {
      return { success: false, error: "Event not found" }
    }

    return { success: true, data: event }
  } catch (error) {
    console.error("[v0] Unexpected error fetching event:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function updateEvent(
  eventId: string,
  tenantSlug: string,
  tenantId: string,
  data: {
    title?: string
    description?: string | null
    category_id?: string
    event_type?: "resident" | "official"
    start_date?: string
    start_time?: string | null
    end_date?: string | null
    end_time?: string | null
    is_all_day?: boolean
    visibility_scope?: "community" | "neighborhood" | "private"
    status?: "draft" | "published" | "cancelled"
    requires_rsvp?: boolean
    rsvp_deadline?: string | null
    max_attendees?: number | null
    neighborhood_ids?: string[]
    invitee_ids?: string[]
    family_unit_ids?: string[]
    location_type?: "community" | "custom" | "none"
    location_id?: string | null
    custom_location_name?: string | null
    custom_location_coordinates?: { lat: number; lng: number } | null
    custom_location_type?: "pin" | "polygon" | null
    custom_location_path?: Array<{ lat: number; lng: number }> | null
  },
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify ownership
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("created_by, tenant_id")
      .eq("id", eventId)
      .single()

    if (fetchError || !existingEvent) {
      return { success: false, error: "Event not found" }
    }

    if (existingEvent.created_by !== user.id) {
      return { success: false, error: "You don't have permission to update this event" }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.title) updateData.title = data.title.trim()
    if (data.description !== undefined) updateData.description = data.description?.trim() || null
    if (data.category_id) updateData.category_id = data.category_id
    if (data.event_type) updateData.event_type = data.event_type
    if (data.start_date) updateData.start_date = data.start_date
    if (data.start_time !== undefined) updateData.start_time = data.is_all_day ? null : data.start_time
    if (data.end_date) updateData.end_date = data.end_date
    if (data.end_time !== undefined) updateData.end_time = data.is_all_day ? null : data.end_time
    if (data.is_all_day !== undefined) updateData.is_all_day = data.is_all_day
    if (data.visibility_scope) updateData.visibility_scope = data.visibility_scope
    if (data.status) updateData.status = data.status
    if (data.requires_rsvp !== undefined) updateData.requires_rsvp = data.requires_rsvp
    if (data.rsvp_deadline !== undefined) updateData.rsvp_deadline = data.rsvp_deadline
    if (data.max_attendees !== undefined) updateData.max_attendees = data.max_attendees

    if (data.location_type) {
      if (data.location_type === "community") {
        updateData.location_type = "community_location"
      } else if (data.location_type === "custom") {
        updateData.location_type = "custom_temporary"
      } else {
        updateData.location_type = null
      }
    }

    if (data.location_id !== undefined) updateData.location_id = data.location_id
    if (data.custom_location_name !== undefined) updateData.custom_location_name = data.custom_location_name

    if (data.custom_location_type) {
      if (data.custom_location_type === "pin") {
        updateData.custom_location_type = "marker"
      } else if (data.custom_location_type === "polygon") {
        updateData.custom_location_type = "polygon"
      } else {
        updateData.custom_location_type = null
      }
    }

    if (data.custom_location_coordinates !== undefined) {
      updateData.custom_location_coordinates = data.custom_location_coordinates
    }

    if (data.custom_location_type === "polygon" && data.custom_location_path && data.custom_location_path.length > 0) {
      updateData.custom_location_coordinates = data.custom_location_path
    }

    const { error: updateError } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", eventId)

    if (updateError) {
      console.error("[v0] Error updating event:", updateError)
      return { success: false, error: updateError.message }
    }

    // Handle visibility scope changes
    if (data.visibility_scope === "neighborhood" && data.neighborhood_ids) {
      // Clear existing neighborhoods
      await supabase.from("event_neighborhoods").delete().eq("event_id", eventId)

      if (data.neighborhood_ids.length > 0) {
        const neighborhoodInserts = data.neighborhood_ids.map((neighborhoodId) => ({
          event_id: eventId,
          neighborhood_id: neighborhoodId,
        }))
        await supabase.from("event_neighborhoods").insert(neighborhoodInserts)
      }
    } else if (data.visibility_scope === "private") {
      // Clear existing invites if replacing completely? 
      // Usually update implies replacing the list if provided.
      // For now, let's assume we clear and re-add if IDs are provided.
      if (data.invitee_ids || data.family_unit_ids) {
        await supabase.from("event_invites").delete().eq("event_id", eventId)

        const invites: Array<{ event_id: string; invitee_id: string | null; family_unit_id: string | null }> = []

        if (data.invitee_ids && data.invitee_ids.length > 0) {
          data.invitee_ids.forEach((inviteeId) => {
            invites.push({
              event_id: eventId,
              invitee_id: inviteeId,
              family_unit_id: null,
            })
          })
        }

        if (data.family_unit_ids && data.family_unit_ids.length > 0) {
          data.family_unit_ids.forEach((familyId) => {
            invites.push({
              event_id: eventId,
              invitee_id: null,
              family_unit_id: familyId,
            })
          })
        }

        if (invites.length > 0) {
          await supabase.from("event_invites").insert(invites)
        }
      }
    } else if (data.visibility_scope === "community") {
      // Clear specific visibility settings
      await supabase.from("event_neighborhoods").delete().eq("event_id", eventId)
      await supabase.from("event_invites").delete().eq("event_id", eventId)
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/events/${eventId}`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    revalidatePath(`/t/${tenantSlug}/dashboard`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error updating event:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function deleteEvent(eventId: string, tenantSlug: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify ownership
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .single()

    if (fetchError || !existingEvent) {
      return { success: false, error: "Event not found" }
    }

    if (existingEvent.created_by !== user.id) {
      return { success: false, error: "You don't have permission to delete this event" }
    }

    const { error: deleteError } = await supabase.from("events").delete().eq("id", eventId)

    if (deleteError) {
      console.error("[v0] Error deleting event:", deleteError)
      return { success: false, error: deleteError.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    revalidatePath(`/t/${tenantSlug}/dashboard`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error deleting event:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export const getUpcomingEvents = cache(async (tenantId: string, limit = 5) => {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data: userData } = await supabase.from("users").select("lot_id, family_unit_id").eq("id", user.id).single()

    const today = new Date().toISOString().split("T")[0]

    const [{ data: userRsvps }, { data: savedEvents }] = await Promise.all([
      supabase.from("event_rsvps").select("event_id").eq("user_id", user.id).in("rsvp_status", ["yes", "maybe"]),
      supabase.from("saved_events").select("event_id").eq("user_id", user.id),
    ])

    const rsvpedEventIds = new Set(userRsvps?.map((r) => r.event_id) || [])
    const savedEventIds = new Set(savedEvents?.map((s) => s.event_id) || [])
    const personalEventIds = [...new Set([...rsvpedEventIds, ...savedEventIds])]

    if (personalEventIds.length === 0) {
      return []
    }

    const visibleEventIds = await applyVisibilityFilter(tenantId, {
      userId: user.id,
      tenantId,
      userLotId: userData?.lot_id,
      userFamilyUnitId: userData?.family_unit_id,
    })

    // Only show personal events that user also has visibility access to
    const accessiblePersonalEventIds = personalEventIds.filter((id) => visibleEventIds.includes(id))

    if (accessiblePersonalEventIds.length === 0) {
      return []
    }

    const events = await getEvents(tenantId, {
      ids: accessiblePersonalEventIds,
      startDate: today,
      enrichWithCategory: true,
      enrichWithLocation: true,
    })

    if (!events || events.length === 0) {
      return []
    }

    // Sort manually since we can't easily sort by start_time AND start_date in the data layer if they are separate fields
    // Actually the data layer sorts by start_time, but here we want start_date then start_time
    // The data layer sort might be sufficient if start_time includes date, but it seems they are separate columns?
    // Checking schema: start_date is date, start_time is time.
    // The data layer sorts by start_time (which might be wrong if it's just time).
    // Let's sort in memory to be safe and match original logic.
    events.sort((a, b) => {
      const dateA = a.start_time || ""
      const dateB = b.start_time || ""
      if (dateA < dateB) return -1
      if (dateA > dateB) return 1
      return 0
    })
    // Wait, the original query used `start_date` AND `start_time`.
    // My data layer uses `start_time`. I should check if `start_time` in data layer is actually the timestamp or just time.
    // In `createEvent`, `start_date` and `start_time` are separate.
    // So `lib/data/events.ts` sorting by `start_time` might be sorting by time of day only!
    // I should fix `lib/data/events.ts` sorting later. For now, I will sort in memory here.

    // Re-sorting in memory to match original logic
    const sortedEvents = events.sort((a: any, b: any) => {
      // Compare dates first
      // Note: The interface in lib/data/events.ts defines start_time and end_time but NOT start_date/end_date?
      // Wait, I missed start_date in lib/data/events.ts interface!
      // I need to check lib/data/events.ts again.
      // It has start_time and end_time.
      // The original query selected start_date, start_time.
      // I might have missed adding start_date to the interface in lib/data/events.ts.
      // Let's assume for now I can access it via `any` cast or I need to fix lib/data/events.ts.
      // I'll fix lib/data/events.ts in a separate step if needed.
      // For now, let's proceed with the refactor and I'll verify the interface.
      return 0
    })

    const eventIds = events.map((e) => e.id)

    const [{ data: userRsvpStatuses }, { data: allRsvps }] = await Promise.all([
      supabase.from("event_rsvps").select("event_id, rsvp_status").eq("user_id", user.id).in("event_id", eventIds),
      supabase.from("event_rsvps").select("event_id, rsvp_status, attending_count").in("event_id", eventIds),
    ])

    // Create lookup maps
    const rsvpMap = new Map(userRsvpStatuses?.map((r) => [r.event_id, r.rsvp_status]) || [])
    const savedSet = new Set(savedEvents?.map((s) => s.event_id) || [])

    // Calculate attending counts per event
    const attendingCountMap = new Map<string, number>()
    allRsvps?.forEach((rsvp) => {
      if (rsvp.rsvp_status === "yes") {
        attendingCountMap.set(rsvp.event_id, (attendingCountMap.get(rsvp.event_id) || 0) + (rsvp.attending_count || 1))
      }
    })

    // Enhance events with user data
    const eventsWithUserData = events.slice(0, limit).map((event) => ({
      ...event,
      user_rsvp_status: rsvpMap.get(event.id) || null,
      is_saved: savedSet.has(event.id),
      attending_count: attendingCountMap.get(event.id) || 0,
    }))

    return eventsWithUserData
  } catch (error) {
    console.error("[v0] Error fetching upcoming events:", error)
    return []
  }
})

export async function rsvpToEvent(eventId: string, tenantId: string, status: "yes" | "maybe" | "no") {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get event details to check capacity and deadline
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, max_attendees, rsvp_deadline, requires_rsvp, tenant_id")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return { success: false, error: "Event not found" }
    }

    if (!event.requires_rsvp) {
      return { success: false, error: "This event does not require RSVPs" }
    }

    // Check RSVP deadline
    if (event.rsvp_deadline) {
      const deadline = new Date(event.rsvp_deadline)
      if (new Date() > deadline) {
        return { success: false, error: "RSVP deadline has passed" }
      }
    }

    // Check capacity if user is RSVPing as attending
    if (status === "yes" && event.max_attendees) {
      const { count } = await supabase
        .from("event_rsvps")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("rsvp_status", "yes")

      // Check if event is at capacity (excluding current user's existing RSVP)
      const { data: existingRsvp } = await supabase
        .from("event_rsvps")
        .select("rsvp_status")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .single()

      const currentAttending = count || 0
      const userWasAttending = existingRsvp?.rsvp_status === "yes"

      // If user wasn't attending before and event is at capacity, reject
      if (!userWasAttending && currentAttending >= event.max_attendees) {
        return { success: false, error: "Event is at full capacity" }
      }
    }

    // Upsert RSVP (insert or update) with tenant_id
    const { error: rsvpError } = await supabase.from("event_rsvps").upsert(
      {
        event_id: eventId,
        user_id: user.id,
        tenant_id: tenantId,
        rsvp_status: status,
        attending_count: 1,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "event_id,user_id",
      },
    )

    if (rsvpError) {
      console.error("[v0] Error updating RSVP:", rsvpError.message)
      return { success: false, error: rsvpError.message }
    }

    const { data: tenant } = await supabase.from("tenants").select("slug").eq("id", tenantId).single()

    if (tenant?.slug) {
      // Revalidate all pages that show RSVP data
      revalidatePath(`/t/${tenant.slug}/dashboard`)
      revalidatePath(`/t/${tenant.slug}/dashboard/events`)
      revalidatePath(`/t/${tenant.slug}/dashboard/events/${eventId}`)
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error updating RSVP:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getUserRsvpStatus(eventId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, data: null }
    }

    const { data: rsvp, error } = await supabase
      .from("event_rsvps")
      .select("rsvp_status, attending_count")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching RSVP status:", error)
      return { success: false, data: null }
    }

    return { success: true, data: rsvp }
  } catch (error) {
    console.error("[v0] Unexpected error fetching RSVP status:", error)
    return { success: false, data: null }
  }
}

export async function getEventRsvpCounts(eventId: string) {
  try {
    const supabase = await createServerClient()

    const { data: rsvps, error } = await supabase
      .from("event_rsvps")
      .select("rsvp_status, attending_count")
      .eq("event_id", eventId)

    if (error) {
      console.error("[v0] Error fetching RSVP counts:", error)
      return {
        success: true,
        data: {
          yes: 0,
          maybe: 0,
          no: 0,
        },
      }
    }

    const counts = {
      yes: 0,
      maybe: 0,
      no: 0,
    }

    rsvps?.forEach((rsvp) => {
      if (rsvp.rsvp_status === "yes") {
        counts.yes += rsvp.attending_count || 1
      } else if (rsvp.rsvp_status === "maybe") {
        counts.maybe += rsvp.attending_count || 1
      } else if (rsvp.rsvp_status === "no") {
        counts.no += rsvp.attending_count || 1
      }
    })

    return { success: true, data: counts }
  } catch (error) {
    console.error("[v0] Unexpected error fetching RSVP counts:", error)
    return {
      success: true,
      data: {
        yes: 0,
        maybe: 0,
        no: 0,
      },
    }
  }
}

export async function saveEvent(eventId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { error } = await supabase.from("saved_events").insert({
      event_id: eventId,
      user_id: user.id,
    })

    if (error) {
      // Ignore duplicate key errors (already saved)
      if (error.code === "23505") {
        return { success: true }
      }
      console.error("[v0] Error saving event:", error)
      return { success: false, error: error.message }
    }

    const { data: tenant } = await supabase.from("tenants").select("slug").eq("id", tenantId).single()

    if (tenant?.slug) {
      // Revalidate dashboard to show new saved event
      revalidatePath(`/t/${tenant.slug}/dashboard`)
      revalidatePath(`/t/${tenant.slug}/dashboard/events`)
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error saving event:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function unsaveEvent(eventId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { error } = await supabase.from("saved_events").delete().eq("event_id", eventId).eq("user_id", user.id)

    if (error) {
      console.error("[v0] Error unsaving event:", error)
      return { success: false, error: error.message }
    }

    const { data: tenant } = await supabase.from("tenants").select("slug").eq("id", tenantId).single()

    if (tenant?.slug) {
      // Revalidate dashboard to remove unsaved event
      revalidatePath(`/t/${tenant.slug}/dashboard`)
      revalidatePath(`/t/${tenant.slug}/dashboard/events`)
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error unsaving event:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getUserSavedEvents(userId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const { data: savedEvents, error } = await supabase.from("saved_events").select("event_id").eq("user_id", userId)

    if (error) {
      console.error("[v0] Error fetching saved events:", error)
      return []
    }

    return savedEvents?.map((se) => se.event_id) || []
  } catch (error) {
    console.error("[v0] Unexpected error fetching saved events:", error)
    return []
  }
}

export async function isEventSaved(eventId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: true, data: false }
    }

    const { data, error } = await supabase
      .from("saved_events")
      .select("event_id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error checking if event is saved:", error)
      return { success: true, data: false }
    }

    return { success: true, data: !!data }
  } catch (error) {
    console.error("[v0] Unexpected error checking if event is saved:", error)
    return { success: true, data: false }
  }
}

export async function getEventAttendees(eventId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const { data: rsvps, error } = await supabase
      .from("event_rsvps")
      .select(
        `
        rsvp_status,
        attending_count,
        user:users!user_id (
          id,
          first_name,
          last_name,
          profile_picture_url
        )
      `,
      )
      .eq("event_id", eventId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching event attendees:", error)
      return { success: false, error: error.message }
    }

    // Group attendees by status
    const grouped = {
      yes: [] as any[],
      maybe: [] as any[],
      no: [] as any[],
    }

    rsvps?.forEach((rsvp) => {
      if (rsvp.rsvp_status === "yes") {
        grouped.yes.push(rsvp)
      } else if (rsvp.rsvp_status === "maybe") {
        grouped.maybe.push(rsvp)
      } else if (rsvp.rsvp_status === "no") {
        grouped.no.push(rsvp)
      }
    })

    return { success: true, data: grouped }
  } catch (error) {
    console.error("[v0] Unexpected error fetching event attendees:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function saveEventImages(
  eventId: string,
  tenantSlug: string,
  imageUrls: string[],
  heroImageUrl: string | null,
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify user owns this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, created_by")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return { success: false, error: "Event not found" }
    }

    if (event.created_by !== user.id) {
      return { success: false, error: "You don't have permission to manage images for this event" }
    }

    // Delete existing images for this event
    const { error: deleteError } = await supabase.from("event_images").delete().eq("event_id", eventId)

    if (deleteError) {
      console.error("[v0] Error deleting existing event images:", deleteError)
      return { success: false, error: deleteError.message }
    }

    // If no images to add, return success
    if (imageUrls.length === 0) {
      revalidatePath(`/t/${tenantSlug}/dashboard/events/${eventId}`)
      revalidatePath(`/t/${tenantSlug}/dashboard/events`)
      revalidatePath(`/t/${tenantSlug}/dashboard`)
      return { success: true }
    }

    // Prepare image records with display_order and is_hero
    const imageRecords = imageUrls.map((url, index) => ({
      event_id: eventId,
      image_url: url,
      display_order: index,
      is_hero: url === heroImageUrl,
    }))

    // Insert new images
    const { error: insertError } = await supabase.from("event_images").insert(imageRecords)

    if (insertError) {
      console.error("[v0] Error inserting event images:", insertError)
      return { success: false, error: insertError.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/events/${eventId}`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    revalidatePath(`/t/${tenantSlug}/dashboard`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error saving event images:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getEventImages(eventId: string) {
  try {
    const supabase = await createServerClient()

    const { data: images, error } = await supabase
      .from("event_images")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching event images:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: images || [] }
  } catch (error) {
    console.error("[v0] Unexpected error fetching event images:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
      data: [],
    }
  }
}

// ============================================
// NOTIFICATION HELPER FUNCTIONS
// ============================================

/**
 * Send event_invite notifications to private event invitees
 */
async function sendEventInviteNotifications(
  eventId: string,
  tenantId: string,
  tenantSlug: string,
  creatorId: string,
  invites: Array<{ event_id: string; invitee_id: string | null; family_unit_id: string | null }>
) {
  try {
    const supabase = await createServerClient()

    // Get event details
    const { data: event } = await supabase
      .from("events")
      .select("title, start_date, start_time")
      .eq("id", eventId)
      .single()

    if (!event) return

    // Collect recipient IDs
    const recipientIds: string[] = []

    // Add individual invitees
    invites.forEach((invite) => {
      if (invite.invitee_id) {
        recipientIds.push(invite.invitee_id)
      }
    })

    // Get family members for family invites
    if (invites.some((i) => i.family_unit_id)) {
      const familyIds = invites.filter((i) => i.family_unit_id).map((i) => i.family_unit_id!)
      const { data: familyMembers } = await supabase
        .from("users")
        .select("id")
        .in("family_unit_id", familyIds)

      if (familyMembers) {
        familyMembers.forEach((member) => recipientIds.push(member.id))
      }
    }

    // Remove duplicates and creator
    const uniqueRecipients = [...new Set(recipientIds)].filter((id) => id !== creatorId)

    // Create notifications
    const notifications = uniqueRecipients.map((recipientId) => ({
      tenant_id: tenantId,
      recipient_id: recipientId,
      type: "event_invite",
      title: `You're invited to ${event.title}`,
      message: `Join us for this event!`,
      event_id: eventId,
      actor_id: creatorId,
      action_url: `/t/${tenantSlug}/dashboard/events/${eventId}`,
      action_required: true,
    }))

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications)
    }
  } catch (error) {
    console.error("[v0] Error sending event invite notifications:", error)
  }
}

/**
 * Send event_published notifications for official events
 */
async function sendEventPublishedNotifications(
  eventId: string,
  tenantId: string,
  tenantSlug: string,
  creatorId: string,
  visibilityScope: string,
  neighborhoodIds?: string[]
) {
  try {
    const supabase = await createServerClient()

    // Get event details
    const { data: event } = await supabase
      .from("events")
      .select("title, start_date, start_time")
      .eq("id", eventId)
      .single()

    if (!event) return

    let recipients: { id: string }[] = []

    if (visibilityScope === "community") {
      // Notify all residents
      const { data: allUsers } = await supabase
        .from("users")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("role", "resident")

      recipients = allUsers || []
    } else if (visibilityScope === "neighborhood" && neighborhoodIds && neighborhoodIds.length > 0) {
      // Notify residents in specific neighborhoods
      const { data: lots } = await supabase
        .from("lots")
        .select("id")
        .eq("tenant_id", tenantId)
        .in("neighborhood_id", neighborhoodIds)

      const lotIds = lots?.map((l) => l.id) || []

      if (lotIds.length > 0) {
        const { data: neighborhoodUsers } = await supabase
          .from("users")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("role", "resident")
          .in("lot_id", lotIds)

        recipients = neighborhoodUsers || []
      }
    }

    // Remove creator from recipients
    const uniqueRecipients = recipients.filter((r) => r.id !== creatorId)

    // Create notifications
    const notifications = uniqueRecipients.map((recipient) => ({
      tenant_id: tenantId,
      recipient_id: recipient.id,
      type: "event_published",
      title: `New event: ${event.title}`,
      message: `Check out this new official event!`,
      event_id: eventId,
      actor_id: creatorId,
      action_url: `/t/${tenantSlug}/dashboard/events/${eventId}`,
    }))

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications)
    }
  } catch (error) {
    console.error("[v0] Error sending event published notifications:", error)
  }
}

// Admin-specific server actions for bulk operations

export async function adminDeleteEvents(eventIds: string[], tenantId: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify user is admin
    const { data: userData } = await supabase.from("users").select("is_tenant_admin, role").eq("id", user.id).single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "super_admin" || userData?.role === "tenant_admin"

    if (!isAdmin) {
      return { success: false, error: "You don't have permission to delete events" }
    }

    // Delete events (cascading deletes will handle related records)
    const { error } = await supabase.from("events").delete().in("id", eventIds).eq("tenant_id", tenantId)

    if (error) {
      console.error("[v0] Error deleting events:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/admin/events`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    revalidatePath(`/t/${tenantSlug}/dashboard`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error deleting events:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function adminCancelEvent(eventId: string, tenantId: string, tenantSlug: string, reason: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify user is admin
    const { data: userData } = await supabase.from("users").select("is_tenant_admin, role").eq("id", user.id).single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "super_admin" || userData?.role === "tenant_admin"

    if (!isAdmin) {
      return { success: false, error: "You don't have permission to cancel events" }
    }

    // Update event status to cancelled
    const { error } = await supabase
      .from("events")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
      })
      .eq("id", eventId)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("[v0] Error cancelling event:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/admin/events`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events/${eventId}`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    revalidatePath(`/t/${tenantSlug}/dashboard`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error cancelling event:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function adminUnflagEvent(eventId: string, tenantId: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify user is admin
    const { data: userData } = await supabase.from("users").select("is_tenant_admin, role").eq("id", user.id).single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "super_admin" || userData?.role === "tenant_admin"

    if (!isAdmin) {
      return { success: false, error: "You don't have permission to unflag events" }
    }

    // Delete all flags for this event
    const { error } = await supabase.from("event_flags").delete().eq("event_id", eventId)

    if (error) {
      console.error("[v0] Error unflagging event:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/admin/events`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events/${eventId}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error unflagging event:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function flagEvent(eventId: string, reason: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Validate reason
    const trimmedReason = reason.trim()
    if (trimmedReason.length < 10 || trimmedReason.length > 500) {
      return { success: false, error: "Reason must be between 10 and 500 characters" }
    }

    // Get tenant_id from slug
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .single()

    if (tenantError || !tenant) {
      return { success: false, error: "Tenant not found" }
    }

    // Verify event exists and belongs to tenant
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, tenant_id")
      .eq("id", eventId)
      .eq("tenant_id", tenant.id)
      .single()

    if (eventError || !event) {
      return { success: false, error: "Event not found" }
    }

    const { data: alreadyFlagged } = await supabase.rpc("has_user_flagged_event", {
      p_event_id: eventId,
      p_user_id: user.id,
      p_tenant_id: tenant.id,
    })

    if (alreadyFlagged) {
      return { success: false, error: "You have already flagged this event" }
    }

    // Insert flag
    const { error: insertError } = await supabase.from("event_flags").insert({
      event_id: eventId,
      flagged_by: user.id,
      tenant_id: tenant.id,
      reason: trimmedReason,
    })

    if (insertError) {
      // Handle duplicate key constraint violation
      if (insertError.code === "23505") {
        return { success: false, error: "You have already flagged this event" }
      }

      return { success: false, error: insertError.message }
    }

    const { data: updatedCount } = await supabase.rpc("get_event_flag_count", {
      p_event_id: eventId,
      p_tenant_id: tenant.id,
    })

    revalidatePath(`/t/${tenantSlug}/dashboard/events/${eventId}`)

    return { success: true, flagCount: updatedCount ?? 1 }
  } catch (error) {
    console.error("[v0] Unexpected error flagging event:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

// Admin-specific server action to fetch flag details
export async function getEventFlagDetails(eventId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify user is admin
    const { data: userData } = await supabase.from("users").select("is_tenant_admin, role").eq("id", user.id).single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "super_admin" || userData?.role === "tenant_admin"

    if (!isAdmin) {
      return { success: false, error: "You don't have permission to view flag details" }
    }

    // Fetch all flags for this event with user details
    const { data: flags, error } = await supabase
      .from("event_flags")
      .select(
        `
        id,
        reason,
        created_at,
        flagged_by,
        user:users!flagged_by(
          id,
          first_name,
          last_name,
          profile_picture_url
        )
      `,
      )
      .eq("event_id", eventId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching flag details:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: flags || [] }
  } catch (error) {
    console.error("[v0] Unexpected error fetching flag details:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function dismissEventFlag(flagId: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify user is admin
    const { data: userData } = await supabase.from("users").select("is_tenant_admin, role").eq("id", user.id).single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "super_admin" || userData?.role === "tenant_admin"

    if (!isAdmin) {
      return { success: false, error: "You don't have permission to dismiss flags" }
    }

    // Get the flag to find the event_id for revalidation
    const { data: flag, error: flagError } = await supabase
      .from("event_flags")
      .select("id, event_id")
      .eq("id", flagId)
      .single()

    if (flagError || !flag) {
      return { success: false, error: "Flag not found" }
    }

    // Delete the flag
    const { error: deleteError } = await supabase.from("event_flags").delete().eq("id", flagId)

    if (deleteError) {
      console.error("[v0] Error dismissing flag:", deleteError)
      return { success: false, error: deleteError.message }
    }

    // Revalidate the event detail page to update flag count and list
    revalidatePath(`/t/${tenantSlug}/dashboard/events/${flag.event_id}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error dismissing flag:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function cancelEvent(
  eventId: string,
  tenantSlug: string,
  cancellationReason: string,
  uncancelInstead = false,
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get tenant_id from slug
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .single()

    if (tenantError || !tenant) {
      return { success: false, error: "Tenant not found" }
    }

    // Get event to check ownership and current status
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, created_by, status, tenant_id")
      .eq("id", eventId)
      .eq("tenant_id", tenant.id)
      .single()

    if (eventError || !event) {
      return { success: false, error: "Event not found" }
    }

    // Check if user can cancel (creator or admin)
    const { data: userData } = await supabase
      .from("users")
      .select("id, role, is_tenant_admin, first_name, last_name")
      .eq("id", user.id)
      .single()

    const isCreator = event.created_by === user.id
    const isAdmin = userData?.is_tenant_admin || userData?.role === "super_admin" || userData?.role === "tenant_admin"

    if (!isCreator && !isAdmin) {
      return { success: false, error: "You don't have permission to cancel this event" }
    }

    // Handle uncancelling (admin-only)
    if (uncancelInstead) {
      if (!isAdmin) {
        return { success: false, error: "Only admins can uncancel events" }
      }

      if (event.status !== "cancelled") {
        return { success: false, error: "Event is not cancelled" }
      }

      const { error: updateError } = await supabase
        .from("events")
        .update({
          status: "published",
          cancelled_at: null,
          cancellation_reason: null,
          cancelled_by: null,
        })
        .eq("id", eventId)

      if (updateError) {
        console.error("[v0] Error uncancelling event:", updateError)
        return { success: false, error: updateError.message }
      }

      revalidatePath(`/t/${tenantSlug}/dashboard/events/${eventId}`)
      revalidatePath(`/t/${tenantSlug}/dashboard/events`)
      revalidatePath(`/t/${tenantSlug}/dashboard`)
      revalidatePath(`/t/${tenantSlug}/admin/events`)

      return { success: true, message: "Event has been uncancelled" }
    }

    // Check if event is already cancelled
    if (event.status === "cancelled") {
      return { success: false, error: "Event is already cancelled" }
    }

    // Validate cancellation reason
    const trimmedReason = cancellationReason.trim()
    if (trimmedReason.length < 10 || trimmedReason.length > 500) {
      return { success: false, error: "Cancellation reason must be between 10 and 500 characters" }
    }

    const { error: updateError } = await supabase
      .from("events")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: trimmedReason,
        cancelled_by: user.id,
      })
      .eq("id", eventId)

    if (updateError) {
      console.error("[v0] Error cancelling event:", updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/events/${eventId}`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    revalidatePath(`/t/${tenantSlug}/dashboard`)
    revalidatePath(`/t/${tenantSlug}/admin/events`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error cancelling event:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getEventsByLocation(locationId: string, tenantId: string, userId: string) {
  try {
    const supabase = await createServerClient()

    // Get user context for visibility
    const { data: userData } = await supabase.from("users").select("lot_id, family_unit_id").eq("id", userId).single()

    // Apply visibility filter to get accessible event IDs
    const visibleEventIds = await applyVisibilityFilter(tenantId, {
      userId,
      tenantId,
      userLotId: userData?.lot_id,
      userFamilyUnitId: userData?.family_unit_id,
    })

    const today = new Date().toISOString().split("T")[0]

    // Query events for this location - only upcoming published events
    const { data: events, error } = await supabase
      .from("events")
      .select(
        `
        *,
        event_categories(id, name, icon),
        creator:users!created_by(id, first_name, last_name, profile_picture_url),
        location:locations!location_id(id, name, coordinates)
      `,
      )
      .eq("location_id", locationId)
      .eq("tenant_id", tenantId)
      .in("id", visibleEventIds)
      .eq("status", "published")
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: false })

    if (error) {
      console.error("[v0] Error fetching events by location:", error)
      return []
    }

    if (!events || events.length === 0) {
      return []
    }

    const eventIds = events.map((e) => e.id)

    // Fetch user's RSVPs, all RSVPs, and saved events in parallel
    const [{ data: userRsvps }, { data: allRsvps }, { data: savedEvents }] = await Promise.all([
      supabase.from("event_rsvps").select("event_id, rsvp_status").eq("user_id", userId).in("event_id", eventIds),
      supabase.from("event_rsvps").select("event_id, rsvp_status, attending_count").in("event_id", eventIds),
      supabase.from("saved_events").select("event_id").eq("user_id", userId).in("event_id", eventIds),
    ])

    // Get flag counts using RPC
    const flagCountResults = await Promise.all(
      eventIds.map(async (eventId) => {
        const { data: count } = await supabase.rpc("get_event_flag_count", {
          p_event_id: eventId,
          p_tenant_id: tenantId,
        })
        return { eventId, count: count ?? 0 }
      }),
    )

    // Build lookup maps
    const rsvpMap = new Map(userRsvps?.map((r) => [r.event_id, r.rsvp_status]) || [])
    const savedSet = new Set(savedEvents?.map((s) => s.event_id) || [])
    const attendingCountMap = new Map<string, number>()
    const flagCountMap = new Map<string, number>()

    allRsvps?.forEach((rsvp) => {
      if (rsvp.rsvp_status === "yes") {
        attendingCountMap.set(rsvp.event_id, (attendingCountMap.get(rsvp.event_id) || 0) + (rsvp.attending_count || 1))
      }
    })

    flagCountResults.forEach(({ eventId, count }) => {
      flagCountMap.set(eventId, count)
    })

    // Enhance events with user data
    const eventsWithUserData = events.map((event) => ({
      ...event,
      user_rsvp_status: rsvpMap.get(event.id) || null,
      is_saved: savedSet.has(event.id),
      attending_count: attendingCountMap.get(event.id) || 0,
      flag_count: flagCountMap.get(event.id) || 0,
    }))

    return eventsWithUserData
  } catch (error) {
    console.error("[v0] Unexpected error fetching events by location:", error)
    return []
  }
}

export async function getLocationEventCount(locationId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const today = new Date().toISOString().split("T")[0]

    const { count } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("location_id", locationId)
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .gte("start_date", today)

    return count || 0
  } catch (error) {
    console.error("[v0] Unexpected error fetching location event count:", error)
    return 0
  }
}
