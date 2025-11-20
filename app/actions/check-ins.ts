"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cache } from 'react'

export async function createCheckIn(
  tenantSlug: string,
  tenantId: string,
  data: {
    title: string
    activity_type: string
    description: string | null
    location_type: "community_location" | "custom_temporary"
    location_id?: string | null
    custom_location_name?: string | null
    custom_location_coordinates?: { lat: number; lng: number } | null
    custom_location_type?: "marker" | "polygon" | "polyline" | null
    start_time: string // ISO timestamp
    duration_minutes: number
    visibility_scope: "community" | "neighborhood" | "private"
    neighborhood_ids?: string[]
    invitee_ids?: string[]
    family_unit_ids?: string[]
  },
) {
  try {
    console.log("[v0] createCheckIn - RECEIVED DATA:", {
      location_type: data.location_type,
      location_id: data.location_id,
      custom_location_name: data.custom_location_name,
      has_custom_coordinates: !!data.custom_location_coordinates,
      custom_coordinates_detail: data.custom_location_coordinates,
      custom_location_type: data.custom_location_type,
    })

    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Validate required fields
    if (!data.title?.trim()) {
      return { success: false, error: "Check-in title is required" }
    }

    if (!data.activity_type) {
      return { success: false, error: "Activity type is required" }
    }

    // Validate duration (30 min to 8 hours)
    if (data.duration_minutes < 30 || data.duration_minutes > 480) {
      return { success: false, error: "Duration must be between 30 minutes and 8 hours" }
    }

    // Validate start time (up to 1 hour in future)
    const startTime = new Date(data.start_time)
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    if (startTime > oneHourFromNow) {
      return { success: false, error: "Check-in start time cannot be more than 1 hour in the future" }
    }

    // Validate location
    if (data.location_type === "community_location" && !data.location_id) {
      return { success: false, error: "Community location is required" }
    }

    if (data.location_type === "custom_temporary") {
      console.log("[v0] Validating custom_temporary location:", {
        has_name: !!data.custom_location_name,
        name: data.custom_location_name,
        has_coordinates: !!data.custom_location_coordinates,
        coordinates: data.custom_location_coordinates,
      })

      if (!data.custom_location_name) {
        console.error("[v0] VALIDATION FAILED: custom_location_name is missing")
        return { success: false, error: "Custom location name is required" }
      }

      if (!data.custom_location_coordinates) {
        console.error("[v0] VALIDATION FAILED: custom_location_coordinates is missing")
        return { success: false, error: "Custom location coordinates are required. Please drop a marker on the map." }
      }

      if (!data.custom_location_coordinates.lat || !data.custom_location_coordinates.lng) {
        console.error("[v0] VALIDATION FAILED: Invalid coordinates:", data.custom_location_coordinates)
        return { success: false, error: "Invalid location coordinates. Please drop a new marker on the map." }
      }
    }

    // Prepare insert data
    const insertData = {
      tenant_id: tenantId,
      created_by: user.id,
      title: data.title.trim(),
      activity_type: data.activity_type,
      description: data.description?.trim() || null,
      location_type: data.location_type,
      location_id: data.location_id || null,
      custom_location_name: data.custom_location_name || null,
      custom_location_coordinates: data.custom_location_coordinates || null,
      custom_location_type: data.custom_location_type || null,
      start_time: data.start_time,
      duration_minutes: data.duration_minutes,
      status: "active",
      visibility_scope: data.visibility_scope,
    }

    console.log("[v0] createCheckIn - DATA BEING INSERTED INTO DATABASE:", {
      ...insertData,
      custom_coordinates_is_null: insertData.custom_location_coordinates === null,
      custom_coordinates_value: insertData.custom_location_coordinates,
      custom_name_is_null: insertData.custom_location_name === null,
      custom_name_value: insertData.custom_location_name,
    })

    // Create check-in
    const { data: checkIn, error } = await supabase
      .from("check_ins")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating check-in - SUPABASE ERROR:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        insertedData: insertData,
      })
      return { success: false, error: error.message }
    }

    console.log("[v0] Check-in created successfully:", checkIn.id)

    // Handle neighborhood visibility
    if (data.visibility_scope === "neighborhood" && data.neighborhood_ids && data.neighborhood_ids.length > 0) {
      const neighborhoodInserts = data.neighborhood_ids.map((neighborhoodId) => ({
        check_in_id: checkIn.id,
        neighborhood_id: neighborhoodId,
      }))

      const { error: neighborhoodError } = await supabase.from("check_in_neighborhoods").insert(neighborhoodInserts)

      if (neighborhoodError) {
        console.error("[v0] Error adding neighborhoods to check-in:", neighborhoodError)
        // Don't fail the whole operation
      }
    }

    // Handle private visibility invites
    if (data.visibility_scope === "private") {
      const invites: any[] = []

      // Add individual invitees
      if (data.invitee_ids && data.invitee_ids.length > 0) {
        data.invitee_ids.forEach((inviteeId) => {
          invites.push({
            check_in_id: checkIn.id,
            invitee_id: inviteeId,
            family_unit_id: null,
          })
        })
      }

      // Add family invites
      if (data.family_unit_ids && data.family_unit_ids.length > 0) {
        data.family_unit_ids.forEach((familyId) => {
          invites.push({
            check_in_id: checkIn.id,
            invitee_id: null,
            family_unit_id: familyId,
          })
        })
      }

      if (invites.length > 0) {
        const { error: inviteError } = await supabase.from("check_in_invites").insert(invites)

        if (inviteError) {
          console.error("[v0] Error adding invites to check-in:", inviteError)
          // Don't fail the whole operation
        }
      }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events`)

    return { success: true, data: checkIn }
  } catch (error) {
    console.error("[v0] Unexpected error creating check-in:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

import { getCheckInById as getCheckInByIdFromLib, getCheckIns } from "@/lib/data/check-ins"

// ... (keep createCheckIn)

export async function getCheckInById(checkInId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const checkIn = await getCheckInByIdFromLib(checkInId, {
      enrichWithCreator: true,
      enrichWithLocation: true,
    })

    if (!checkIn || checkIn.tenant_id !== tenantId) {
      return { success: false, error: "Check-in not found" }
    }

    return { success: true, data: checkIn }
  } catch (error) {
    console.error("[v0] Unexpected error fetching check-in:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export const getActiveCheckIns = cache(async (tenantId: string) => {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] getActiveCheckIns - No authenticated user")
      return []
    }

    // Get user context for visibility
    const { data: userData } = await supabase.from("users").select("lot_id, family_unit_id").eq("id", user.id).single()

    console.log("[v0] getActiveCheckIns - Fetching check-ins for tenant:", tenantId)

    const checkIns = await getCheckIns(tenantId, {
      activeOnly: true,
      enrichWithCreator: true,
      enrichWithLocation: true,
      enrichWithRsvp: true,
    })

    if (!checkIns || checkIns.length === 0) {
      console.log("[v0] getActiveCheckIns - No active check-ins found")
      return []
    }

    // Filter by visibility (application-level)
    const visibleCheckIns = checkIns.filter((checkIn) => {
      if (checkIn.visibility_scope === "community") {
        return true
      }
      if (checkIn.created_by === user.id) {
        return true
      }
      // TODO: Add neighborhood and private filtering
      return false
    })

    console.log("[v0] getActiveCheckIns - After filtering:", {
      initialCount: checkIns.length,
      visibleCount: visibleCheckIns.length,
    })

    // Transform to match expected output format if needed
    // The lib returns CheckInWithRelations which is compatible with the UI components
    // but we might need to ensure field names match exactly what the UI expects.
    // The UI expects `creator` and `location` objects.
    // My lib returns `creator` and `location`.
    // `user_rsvp_status` and `attending_count` are also returned by lib.

    // However, the original action did some explicit mapping.
    // Let's map it to be safe and ensure `created_by_user` is present if needed (it was in the original).

    const checkInsWithUserData = visibleCheckIns.map((checkIn) => {
      return {
        ...checkIn,
        // Also include as created_by_user for map markers (legacy support)
        created_by_user: checkIn.creator,
      }
    })

    return checkInsWithUserData
  } catch (error) {
    console.error("[v0] Unexpected error fetching active check-ins:", error)
    return []
  }
})

export async function updateCheckIn(
  checkInId: string,
  tenantSlug: string,
  tenantId: string,
  data: {
    title?: string
    activity_type?: string
    description?: string | null
    visibility_scope?: "community" | "neighborhood" | "private"
    neighborhood_ids?: string[]
    invitee_ids?: string[]
    family_unit_ids?: string[]
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

    // Get check-in to verify ownership
    const { data: checkIn, error: checkInError } = await supabase
      .from("check_ins")
      .select("id, created_by, tenant_id, visibility_scope")
      .eq("id", checkInId)
      .eq("tenant_id", tenantId)
      .single()

    if (checkInError || !checkIn) {
      return { success: false, error: "Check-in not found" }
    }

    // Only creator can edit
    if (checkIn.created_by !== user.id) {
      return { success: false, error: "You don't have permission to edit this check-in" }
    }

    const updateData: any = {}

    if (data.title !== undefined) {
      if (!data.title.trim()) {
        return { success: false, error: "Check-in title is required" }
      }
      updateData.title = data.title.trim()
    }

    if (data.activity_type !== undefined) {
      updateData.activity_type = data.activity_type
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null
    }

    if (data.visibility_scope !== undefined) {
      updateData.visibility_scope = data.visibility_scope

      const oldScope = checkIn.visibility_scope
      const newScope = data.visibility_scope

      // Clean up old visibility data
      if (oldScope === "neighborhood" && newScope !== "neighborhood") {
        await supabase.from("check_in_neighborhoods").delete().eq("check_in_id", checkInId)
      }

      if (oldScope === "private" && newScope !== "private") {
        await supabase.from("check_in_invites").delete().eq("check_in_id", checkInId)
      }
    }

    const { error } = await supabase.from("check_ins").update(updateData).eq("id", checkInId)

    if (error) {
      console.error("[v0] Error updating check-in:", error)
      return { success: false, error: error.message }
    }

    // Handle new neighborhood visibility
    if (data.visibility_scope === "neighborhood" && data.neighborhood_ids && data.neighborhood_ids.length > 0) {
      await supabase.from("check_in_neighborhoods").delete().eq("check_in_id", checkInId)

      const neighborhoodInserts = data.neighborhood_ids.map((neighborhoodId) => ({
        check_in_id: checkInId,
        neighborhood_id: neighborhoodId,
      }))

      await supabase.from("check_in_neighborhoods").insert(neighborhoodInserts)
    }

    // Handle new private invites
    if (data.visibility_scope === "private" && (data.invitee_ids || data.family_unit_ids)) {
      await supabase.from("check_in_invites").delete().eq("check_in_id", checkInId)

      const invites: any[] = []

      if (data.invitee_ids && data.invitee_ids.length > 0) {
        data.invitee_ids.forEach((inviteeId) => {
          invites.push({
            check_in_id: checkInId,
            invitee_id: inviteeId,
            family_unit_id: null,
          })
        })
      }

      if (data.family_unit_ids && data.family_unit_ids.length > 0) {
        data.family_unit_ids.forEach((familyId) => {
          invites.push({
            check_in_id: checkInId,
            invitee_id: null,
            family_unit_id: familyId,
          })
        })
      }

      if (invites.length > 0) {
        await supabase.from("check_in_invites").insert(invites)
      }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error updating check-in:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function deleteCheckIn(checkInId: string, tenantId: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get check-in to verify ownership
    const { data: checkIn, error: checkInError } = await supabase
      .from("check_ins")
      .select("id, created_by, tenant_id")
      .eq("id", checkInId)
      .eq("tenant_id", tenantId)
      .single()

    if (checkInError || !checkIn) {
      return { success: false, error: "Check-in not found" }
    }

    // Only creator can delete
    if (checkIn.created_by !== user.id) {
      return { success: false, error: "Only the check-in creator can delete this check-in" }
    }

    // Perform hard delete (cascading will handle related records)
    const { error: deleteError } = await supabase.from("check_ins").delete().eq("id", checkInId)

    if (deleteError) {
      console.error("[v0] Error deleting check-in:", deleteError)
      return { success: false, error: deleteError.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error deleting check-in:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function extendCheckIn(
  checkInId: string,
  tenantId: string,
  tenantSlug: string,
  additionalMinutes: number,
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get check-in to verify ownership
    const { data: checkIn, error: checkInError } = await supabase
      .from("check_ins")
      .select("id, created_by, tenant_id, duration_minutes")
      .eq("id", checkInId)
      .eq("tenant_id", tenantId)
      .single()

    if (checkInError || !checkIn) {
      return { success: false, error: "Check-in not found" }
    }

    // Only creator can extend
    if (checkIn.created_by !== user.id) {
      return { success: false, error: "You don't have permission to extend this check-in" }
    }

    const newDuration = checkIn.duration_minutes + additionalMinutes

    // Validate new duration (max 8 hours)
    if (newDuration > 480) {
      return { success: false, error: "Check-in duration cannot exceed 8 hours" }
    }

    const { error } = await supabase.from("check_ins").update({ duration_minutes: newDuration }).eq("id", checkInId)

    if (error) {
      console.error("[v0] Error extending check-in:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error extending check-in:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function endCheckInEarly(checkInId: string, tenantId: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get check-in to verify ownership
    const { data: checkIn, error: checkInError } = await supabase
      .from("check_ins")
      .select("id, created_by, tenant_id")
      .eq("id", checkInId)
      .eq("tenant_id", tenantId)
      .single()

    if (checkInError || !checkIn) {
      return { success: false, error: "Check-in not found" }
    }

    // Only creator can end early
    if (checkIn.created_by !== user.id) {
      return { success: false, error: "You don't have permission to end this check-in" }
    }

    const { error } = await supabase
      .from("check_ins")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("id", checkInId)

    if (error) {
      console.error("[v0] Error ending check-in early:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error ending check-in early:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function rsvpToCheckIn(
  checkInId: string,
  tenantId: string,
  tenantSlug: string,
  status: "yes" | "maybe" | "no",
  attendingCount = 1,
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify check-in exists
    const { data: checkIn, error: checkInError } = await supabase
      .from("check_ins")
      .select("id, tenant_id")
      .eq("id", checkInId)
      .single()

    if (checkInError || !checkIn) {
      return { success: false, error: "Check-in not found" }
    }

    // Upsert RSVP
    const { error: rsvpError } = await supabase.from("check_in_rsvps").upsert(
      {
        check_in_id: checkInId,
        user_id: user.id,
        tenant_id: tenantId,
        rsvp_status: status,
        attending_count: attendingCount,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "check_in_id,user_id",
      },
    )

    if (rsvpError) {
      console.error("[v0] Error updating RSVP:", rsvpError)
      return { success: false, error: rsvpError.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard`)
    revalidatePath(`/t/${tenantSlug}/dashboard/events`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error updating RSVP:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getCheckInRsvps(checkInId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const { data: rsvps, error } = await supabase
      .from("check_in_rsvps")
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
      .eq("check_in_id", checkInId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching check-in RSVPs:", error)
      return { success: false, error: error.message }
    }

    // Group RSVPs by status
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
    console.error("[v0] Unexpected error fetching check-in RSVPs:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getCheckInRsvpCounts(checkInId: string) {
  try {
    const supabase = await createServerClient()

    const { data: rsvps, error } = await supabase
      .from("check_in_rsvps")
      .select("rsvp_status, attending_count")
      .eq("check_in_id", checkInId)

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

export async function getCheckInsByLocation(locationId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] getCheckInsByLocation - No authenticated user")
      return []
    }

    console.log("[v0] getCheckInsByLocation - Fetching check-ins for location:", locationId)

    // Fetch check-ins for this specific location
    const { data: checkIns, error } = await supabase
      .from("check_ins")
      .select(
        `
        *,
        creator:users!created_by(id, first_name, last_name, profile_picture_url),
        location:locations!location_id(id, name, coordinates, boundary_coordinates, path_coordinates)
      `,
      )
      .eq("tenant_id", tenantId)
      .eq("location_id", locationId)
      .eq("location_type", "community_location")
      .eq("status", "active")
      .filter("start_time", "gte", new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString())
      .order("start_time", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching location check-ins:", error)
      return []
    }

    if (!checkIns || checkIns.length === 0) {
      console.log("[v0] getCheckInsByLocation - No check-ins found for location")
      return []
    }

    // Filter out expired check-ins
    const now = new Date()
    const nonExpiredCheckIns = checkIns.filter((checkIn) => {
      const expiresAt = new Date(checkIn.start_time)
      expiresAt.setMinutes(expiresAt.getMinutes() + checkIn.duration_minutes)
      return expiresAt > now
    })

    // Filter by visibility
    const visibleCheckIns = nonExpiredCheckIns.filter((checkIn) => {
      if (checkIn.visibility_scope === "community") {
        return true
      }
      if (checkIn.created_by === user.id) {
        return true
      }
      return false
    })

    console.log("[v0] getCheckInsByLocation - Visible check-ins:", visibleCheckIns.length)

    // Get RSVP data
    const checkInIds = visibleCheckIns.map((c) => c.id)

    if (checkInIds.length === 0) {
      return []
    }

    const [{ data: userRsvps }, { data: allRsvps }] = await Promise.all([
      supabase
        .from("check_in_rsvps")
        .select("check_in_id, rsvp_status")
        .eq("user_id", user.id)
        .in("check_in_id", checkInIds),
      supabase.from("check_in_rsvps").select("check_in_id, rsvp_status, attending_count").in("check_in_id", checkInIds),
    ])

    const rsvpMap = new Map(userRsvps?.map((r) => [r.check_in_id, r.rsvp_status]) || [])

    const attendingCountMap = new Map<string, number>()
    allRsvps?.forEach((rsvp) => {
      if (rsvp.rsvp_status === "yes") {
        const current = attendingCountMap.get(rsvp.check_in_id) || 0
        attendingCountMap.set(rsvp.check_in_id, current + (rsvp.attending_count || 1))
      }
    })

    const checkInsWithUserData = visibleCheckIns.map((checkIn) => ({
      id: checkIn.id,
      tenant_id: checkIn.tenant_id,
      created_by: checkIn.created_by,
      title: checkIn.title,
      activity_type: checkIn.activity_type,
      description: checkIn.description,
      location_type: checkIn.location_type,
      location_id: checkIn.location_id,
      custom_location_name: checkIn.custom_location_name,
      custom_location_coordinates: checkIn.custom_location_coordinates,
      custom_location_type: checkIn.custom_location_type,
      start_time: checkIn.start_time,
      duration_minutes: checkIn.duration_minutes,
      status: checkIn.status,
      visibility_scope: checkIn.visibility_scope,
      created_at: checkIn.created_at,
      updated_at: checkIn.updated_at,
      ended_at: checkIn.ended_at,
      creator: checkIn.creator
        ? {
          id: checkIn.creator.id,
          first_name: checkIn.creator.first_name,
          last_name: checkIn.creator.last_name,
          profile_picture_url: checkIn.creator.profile_picture_url,
        }
        : null,
      location: checkIn.location
        ? {
          id: checkIn.location.id,
          name: checkIn.location.name,
          coordinates: checkIn.location.coordinates,
          boundary_coordinates: checkIn.location.boundary_coordinates,
          path_coordinates: checkIn.location.path_coordinates,
        }
        : null,
      user_rsvp_status: rsvpMap.get(checkIn.id) || null,
      attending_count: attendingCountMap.get(checkIn.id) || 0,
    }))

    return checkInsWithUserData
  } catch (error) {
    console.error("[v0] Unexpected error fetching location check-ins:", error)
    return []
  }
}
