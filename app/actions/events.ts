"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { applyVisibilityFilter, canUserViewEvent } from "@/lib/visibility-filter"

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
      const invites = []

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
        }
      }
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

    const { data: event, error } = await supabase
      .from("events")
      .select(
        `
        *,
        category:event_categories(id, name, icon),
        creator:users!created_by(id, first_name, last_name, profile_picture_url),
        location:locations!location_id(id, name, coordinates)
      `,
      )
      .eq("id", eventId)
      .eq("tenant_id", tenantId)
      .single()

    if (error) {
      console.error("[v0] Error fetching event:", error)
      return { success: false, error: error.message }
    }

    if (!event) {
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

export async function deleteEvent(eventId: string, tenantId: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get event to check ownership
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, created_by, tenant_id")
      .eq("id", eventId)
      .eq("tenant_id", tenantId)
      .single()

    if (eventError || !event) {
      return { success: false, error: "Event not found" }
    }

    // Only creator can delete (not admins)
    const isCreator = event.created_by === user.id

    if (!isCreator) {
      return { success: false, error: "Only the event creator can delete this event" }
    }

    // Perform hard delete
    const { error: deleteError } = await supabase.from("events").delete().eq("id", eventId)

    if (deleteError) {
      console.error("[v0] Error deleting event:", deleteError)
      return { success: false, error: deleteError.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error deleting event:", error)
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
    title: string
    description: string | null
    category_id: string
    event_type: "resident" | "official"
    start_date: string
    start_time: string | null
    end_date: string | null
    end_time: string | null
    is_all_day?: boolean
    status?: "draft" | "published" | "cancelled"
    requires_rsvp?: boolean
    rsvp_deadline?: string | null
    max_attendees?: number | null
    visibility_scope?: "community" | "neighborhood" | "private"
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

    // Get event to check ownership
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, created_by, tenant_id, visibility_scope")
      .eq("id", eventId)
      .eq("tenant_id", tenantId)
      .single()

    if (eventError || !event) {
      return { success: false, error: "Event not found" }
    }

    // Check if user can edit (creator or admin)
    const { data: userData } = await supabase
      .from("users")
      .select("id, role, is_tenant_admin")
      .eq("id", user.id)
      .single()

    const isCreator = event.created_by === user.id
    const isAdmin = userData?.is_tenant_admin || userData?.role === "super_admin" || userData?.role === "tenant_admin"

    if (!isCreator && !isAdmin) {
      return { success: false, error: "You don't have permission to edit this event" }
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

    const updateData: any = {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      category_id: data.category_id,
      event_type: data.event_type,
      start_date: data.start_date,
      start_time: startTime,
      end_date: endDate,
      end_time: endTime,
      is_all_day: data.is_all_day || false,
      status: data.status || "published",
      requires_rsvp: data.requires_rsvp || false,
      rsvp_deadline: data.rsvp_deadline || null,
      max_attendees: data.max_attendees || null,
      location_type: dbLocationType,
      location_id: data.location_id || null,
      custom_location_name: data.custom_location_name || null,
      custom_location_coordinates: customLocationCoordinates || null,
      custom_location_type: dbCustomLocationType,
    }

    if (data.visibility_scope) {
      updateData.visibility_scope = data.visibility_scope

      const oldScope = event.visibility_scope
      const newScope = data.visibility_scope

      // Clean up neighborhood data when changing away from neighborhood
      if (oldScope === "neighborhood" && newScope !== "neighborhood") {
        await supabase.from("event_neighborhoods").delete().eq("event_id", eventId)
      }

      // Clean up invite data when changing away from private
      if (oldScope === "private" && newScope !== "private") {
        await supabase.from("event_invites").delete().eq("event_id", eventId)
      }
    }

    const { data: updatedEvent, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", eventId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating event:", error)
      return { success: false, error: error.message }
    }

    if (data.visibility_scope === "neighborhood" && data.neighborhood_ids && data.neighborhood_ids.length > 0) {
      // Delete existing neighborhoods (in case of re-selection)
      await supabase.from("event_neighborhoods").delete().eq("event_id", eventId)

      // Insert new neighborhoods
      const neighborhoodInserts = data.neighborhood_ids.map((neighborhoodId) => ({
        event_id: eventId,
        neighborhood_id: neighborhoodId,
      }))

      await supabase.from("event_neighborhoods").insert(neighborhoodInserts)
    }

    if (data.visibility_scope === "private" && (data.invitee_ids || data.family_unit_ids)) {
      // Delete existing invites (in case of re-selection)
      await supabase.from("event_invites").delete().eq("event_id", eventId)

      // Insert new invites
      const invites = []

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

    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events/${eventId}`)
    return { success: true, data: updatedEvent }
  } catch (error) {
    console.error("[v0] Unexpected error updating event:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getUpcomingEvents(tenantId: string, limit = 5) {
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

    const { data: events, error } = await supabase
      .from("events")
      .select(
        `
        id,
        title,
        description,
        start_date,
        start_time,
        end_time,
        is_all_day,
        tenant_id,
        requires_rsvp,
        max_attendees,
        rsvp_deadline,
        event_categories (
          name,
          icon
        ),
        location_type,
        location_id,
        custom_location_name,
        custom_location_coordinates,
        custom_location_type,
        location:locations!location_id(id, name, coordinates)
      `,
      )
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .gte("start_date", today)
      .in("id", accessiblePersonalEventIds)
      .order("start_date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: false })
      .limit(limit)

    if (error) {
      console.error("[v0] Error fetching upcoming events:", error)
      return []
    }

    if (!events || events.length === 0) {
      return []
    }

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
        const current = attendingCountMap.get(rsvp.event_id) || 0
        attendingCountMap.set(rsvp.event_id, current + (rsvp.attending_count || 1))
      }
    })

    // Enhance events with user data
    const eventsWithUserData = events.map((event) => ({
      ...event,
      user_rsvp_status: rsvpMap.get(event.id) || null,
      is_saved: savedSet.has(event.id),
      attending_count: attendingCountMap.get(event.id) || 0,
    }))

    return eventsWithUserData
  } catch (error) {
    console.error("[v0] Unexpected error fetching upcoming events:", error)
    return []
  }
}

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
