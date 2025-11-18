"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"
import type { CreateRequestData, RequestStatus } from "@/types/requests"

export async function createResidentRequest(
  tenantId: string,
  tenantSlug: string,
  data: CreateRequestData
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("resident_requests")
      .insert({
        tenant_id: tenantId,
        created_by: data.is_anonymous ? null : user.id,
        original_submitter_id: user.id, // Always store actual submitter
        title: data.title,
        request_type: data.request_type,
        description: data.description,
        priority: data.priority,
        location_type: data.location_type || null,
        location_id: data.location_id || null,
        custom_location_name: data.custom_location_name || null,
        custom_location_lat: data.custom_location_lat || null,
        custom_location_lng: data.custom_location_lng || null,
        is_anonymous: data.is_anonymous || false,
        images: data.images || [],
        tagged_resident_ids: data.tagged_resident_ids || [],
        tagged_pet_ids: data.tagged_pet_ids || [],
        status: 'pending',
      })

    if (error) {
      console.error("[v0] Error creating request:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/requests`)
    revalidatePath(`/t/${tenantSlug}/admin/requests`)
    
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error creating request:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function updateRequestStatus(
  requestId: string,
  tenantId: string,
  tenantSlug: string,
  status: RequestStatus,
  reason?: string
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role, is_tenant_admin")
      .eq("id", user.id)
      .eq("tenant_id", tenantId)
      .single()

    if (!userData || (!['tenant_admin', 'super_admin'].includes(userData.role) && !userData.is_tenant_admin)) {
      return { success: false, error: "Unauthorized" }
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = user.id
    }

    if (status === 'rejected' && reason) {
      updateData.rejection_reason = reason
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = user.id
    }

    const { data: request, error } = await supabase
      .from("resident_requests")
      .update(updateData)
      .eq("id", requestId)
      .eq("tenant_id", tenantId)
      .select("created_by, title, request_type")
      .single()

    if (error) {
      console.error("[v0] Error updating request status:", error)
      return { success: false, error: error.message }
    }

    // Send notification to resident about status change
    if (request.created_by) {
      await createNotification({
        tenant_id: tenantId,
        recipient_id: request.created_by,
        type: 'request_status_changed',
        title: `Request ${status}: ${request.title}`,
        message: status === 'rejected' && reason 
          ? `Reason: ${reason}`
          : `Your ${request.request_type} request has been ${status}.`,
        actor_id: user.id,
        resident_request_id: requestId,
        action_url: `/t/${tenantSlug}/dashboard/requests/${requestId}`,
      })
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/requests`)
    revalidatePath(`/t/${tenantSlug}/dashboard/requests/${requestId}`)
    revalidatePath(`/t/${tenantSlug}/admin/requests`)
    revalidatePath(`/t/${tenantSlug}/admin/requests/${requestId}`)
    
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error updating request status:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function addAdminReply(
  requestId: string,
  tenantId: string,
  tenantSlug: string,
  reply: string,
  internalNotes?: string
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role, is_tenant_admin")
      .eq("id", user.id)
      .eq("tenant_id", tenantId)
      .single()

    if (!userData || (!['tenant_admin', 'super_admin'].includes(userData.role) && !userData.is_tenant_admin)) {
      return { success: false, error: "Unauthorized" }
    }

    // Get current request to check if this is first reply
    const { data: currentRequest } = await supabase
      .from("resident_requests")
      .select("first_reply_at")
      .eq("id", requestId)
      .single()

    const updateData: any = {
      admin_reply: reply,
      status: 'in_progress',
    }

    // Set first_reply_at if this is the first reply
    if (currentRequest && !currentRequest.first_reply_at) {
      updateData.first_reply_at = new Date().toISOString()
    }

    if (internalNotes) {
      updateData.admin_internal_notes = internalNotes
    }

    const { data: request, error } = await supabase
      .from("resident_requests")
      .update(updateData)
      .eq("id", requestId)
      .eq("tenant_id", tenantId)
      .select("created_by, title, request_type")
      .single()

    if (error) {
      console.error("[v0] Error adding admin reply:", error)
      return { success: false, error: error.message }
    }

    // Send notification to resident about admin reply
    if (request.created_by) {
      await createNotification({
        tenant_id: tenantId,
        recipient_id: request.created_by,
        type: 'request_admin_reply',
        title: `Admin replied to your request: ${request.title}`,
        message: reply,
        actor_id: user.id,
        resident_request_id: requestId,
        action_url: `/t/${tenantSlug}/dashboard/requests/${requestId}`,
      })
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/requests`)
    revalidatePath(`/t/${tenantSlug}/dashboard/requests/${requestId}`)
    revalidatePath(`/t/${tenantSlug}/admin/requests`)
    revalidatePath(`/t/${tenantSlug}/admin/requests/${requestId}`)
    
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error adding admin reply:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getMyRequests(tenantId: string) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data: requests, error } = await supabase
      .from("resident_requests")
      .select(`
        *,
        location:location_id(id, name, type),
        resolved_by_user:resolved_by(first_name, last_name)
      `)
      .eq("tenant_id", tenantId)
      .eq("original_submitter_id", user.id)
      .neq("status", "resolved")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching my requests:", error)
      return []
    }

    return requests || []
  } catch (error) {
    console.error("[v0] Unexpected error fetching my requests:", error)
    return []
  }
}

export async function getAllRequests(tenantId: string) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    // Verify admin
    const { data: userData } = await supabase
      .from("users")
      .select("role, is_tenant_admin")
      .eq("id", user.id)
      .eq("tenant_id", tenantId)
      .single()

    if (!userData || (!['tenant_admin', 'super_admin'].includes(userData.role) && !userData.is_tenant_admin)) {
      return []
    }

    const { data: requests, error } = await supabase
      .from("resident_requests")
      .select(`
        *,
        creator:created_by(id, first_name, last_name, lot_id, lots(lot_number)),
        location:location_id(id, name, type),
        resolved_by_user:resolved_by(first_name, last_name)
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching all requests:", error)
      return []
    }

    return requests || []
  } catch (error) {
    console.error("[v0] Unexpected error fetching all requests:", error)
    return []
  }
}

export async function getCommunityRequests(tenantId: string) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] No user found for community requests")
      return []
    }

    console.log("[v0] Fetching community requests for tenant:", tenantId)
    console.log("[v0] User ID:", user.id)

    const { data: requests, error } = await supabase
      .from("resident_requests")
      .select(`
        *,
        creator:created_by(id, first_name, last_name, profile_picture_url),
        location:location_id(id, name, type),
        resolved_by_user:resolved_by(first_name, last_name)
      `)
      .eq("tenant_id", tenantId)
      .in("request_type", ["maintenance", "safety"])
      .order("created_at", { ascending: false })

    console.log("[v0] Community requests query error:", error)
    console.log("[v0] Community requests count:", requests?.length || 0)
    
    if (requests && requests.length > 0) {
      console.log("[v0] First request sample:", JSON.stringify(requests[0], null, 2))
    }

    if (error) {
      console.error("[v0] Error fetching community requests:", error)
      return []
    }

    return requests || []
  } catch (error) {
    console.error("[v0] Unexpected error fetching community requests:", error)
    return []
  }
}
