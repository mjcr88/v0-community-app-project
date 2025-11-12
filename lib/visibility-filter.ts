// Visibility filtering helper for application-level security
// This replaces RLS policies to avoid infinite recursion issues

import { createServerClient } from "@/lib/supabase/server"

export interface VisibilityContext {
  userId: string
  tenantId: string
  userLotId?: string | null
  userFamilyUnitId?: string | null
}

/**
 * Check if a user can view a specific event based on visibility rules
 * @param eventId - The event ID to check
 * @param context - User context (userId, tenantId, lotId, familyUnitId)
 * @returns Promise<boolean> - Whether the user has access
 */
export async function canUserViewEvent(eventId: string, context: VisibilityContext): Promise<boolean> {
  const supabase = await createServerClient()

  // Get event details
  const { data: event, error } = await supabase
    .from("events")
    .select("id, visibility_scope, created_by, tenant_id")
    .eq("id", eventId)
    .eq("tenant_id", context.tenantId)
    .single()

  if (error || !event) {
    return false
  }

  // Event creator can always view their own events
  if (event.created_by === context.userId) {
    return true
  }

  // Check visibility scope
  if (event.visibility_scope === "community") {
    return true
  }

  if (event.visibility_scope === "neighborhood") {
    // Check if user's lot is in one of the event's neighborhoods
    if (!context.userLotId) {
      return false
    }

    // Get user's neighborhood through their lot
    const { data: userLot } = await supabase.from("lots").select("neighborhood_id").eq("id", context.userLotId).single()

    if (!userLot?.neighborhood_id) {
      return false
    }

    // Check if event is visible to this neighborhood
    const { data: eventNeighborhoods } = await supabase
      .from("event_neighborhoods")
      .select("neighborhood_id")
      .eq("event_id", eventId)

    const allowedNeighborhoodIds = eventNeighborhoods?.map((en) => en.neighborhood_id) || []
    return allowedNeighborhoodIds.includes(userLot.neighborhood_id)
  }

  if (event.visibility_scope === "private") {
    // Check if user or their family is invited
    const { data: invites } = await supabase
      .from("event_invites")
      .select("invitee_id, family_unit_id")
      .eq("event_id", eventId)

    if (!invites || invites.length === 0) {
      return false
    }

    // Check if user is directly invited
    const isDirectlyInvited = invites.some((invite) => invite.invitee_id === context.userId)
    if (isDirectlyInvited) {
      return true
    }

    // Check if user's family is invited
    if (context.userFamilyUnitId) {
      const isFamilyInvited = invites.some((invite) => invite.family_unit_id === context.userFamilyUnitId)
      if (isFamilyInvited) {
        return true
      }
    }

    return false
  }

  // Default: deny access for unknown visibility scopes
  return false
}

/**
 * Filter events query to only include events user has access to
 * This adds the necessary WHERE clauses to respect visibility rules
 *
 * @param query - Supabase query builder for events table
 * @param context - User context (userId, tenantId, lotId, familyUnitId)
 * @returns Modified query with visibility filtering applied
 */
export async function applyVisibilityFilter(tenantId: string, context: VisibilityContext): Promise<string[]> {
  const supabase = await createServerClient()

  // Get all event IDs the user has access to
  const visibleEventIds: string[] = []

  // 1. Get all community events
  const { data: communityEvents } = await supabase
    .from("events")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("visibility_scope", "community")

  if (communityEvents) {
    visibleEventIds.push(...communityEvents.map((e) => e.id))
  }

  // 2. Get user's own created events (all visibility scopes)
  const { data: ownEvents } = await supabase
    .from("events")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("created_by", context.userId)

  if (ownEvents) {
    visibleEventIds.push(...ownEvents.map((e) => e.id))
  }

  // 3. Get neighborhood events (if user has a lot with neighborhood)
  if (context.userLotId) {
    const { data: userLot } = await supabase.from("lots").select("neighborhood_id").eq("id", context.userLotId).single()

    if (userLot?.neighborhood_id) {
      // Get events in this neighborhood
      const { data: neighborhoodEventLinks } = await supabase
        .from("event_neighborhoods")
        .select("event_id")
        .eq("neighborhood_id", userLot.neighborhood_id)

      if (neighborhoodEventLinks) {
        const neighborhoodEventIds = neighborhoodEventLinks.map((en) => en.event_id)

        // Verify these are actually neighborhood visibility events
        const { data: neighborhoodEvents } = await supabase
          .from("events")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("visibility_scope", "neighborhood")
          .in("id", neighborhoodEventIds)

        if (neighborhoodEvents) {
          visibleEventIds.push(...neighborhoodEvents.map((e) => e.id))
        }
      }
    }
  }

  // 4. Get private events where user or family is invited
  const { data: invites } = await supabase
    .from("event_invites")
    .select("event_id")
    .or(
      `invitee_id.eq.${context.userId},family_unit_id.eq.${context.userFamilyUnitId || "00000000-0000-0000-0000-000000000000"}`,
    )

  if (invites) {
    const invitedEventIds = invites.map((inv) => inv.event_id)

    // Verify these are actually private visibility events
    const { data: privateEvents } = await supabase
      .from("events")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("visibility_scope", "private")
      .in("id", invitedEventIds)

    if (privateEvents) {
      visibleEventIds.push(...privateEvents.map((e) => e.id))
    }
  }

  // Remove duplicates
  return [...new Set(visibleEventIds)]
}
