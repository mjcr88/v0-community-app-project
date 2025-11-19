"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { CreateAnnouncementData, UpdateAnnouncementData } from "@/types/announcements"
import { createNotification } from "./notifications"

export async function createAnnouncement(
  tenantSlug: string,
  tenantId: string,
  data: CreateAnnouncementData,
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("is_tenant_admin, role")
      .eq("id", user.id)
      .single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "tenant_admin" || userData?.role === "super_admin"

    if (!isAdmin) {
      return { success: false, error: "Only tenant admins can create announcements" }
    }

    // Validate required fields
    if (!data.title?.trim()) {
      return { success: false, error: "Announcement title is required" }
    }

    // Map location_type from UI to database format
    let dbLocationType: string | null = null
    if (data.location_type === "community") {
      dbLocationType = "community_location"
    } else if (data.location_type === "custom") {
      dbLocationType = "custom_temporary"
    }

    const announcementData: any = {
      tenant_id: tenantId,
      created_by: user.id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      announcement_type: data.announcement_type,
      priority: data.priority,
      status: data.status || "draft",
      event_id: data.event_id || null,
      location_type: dbLocationType,
      location_id: data.location_id || null,
      custom_location_name: data.custom_location_name || null,
      custom_location_lat: data.custom_location_lat || null,
      custom_location_lng: data.custom_location_lng || null,
      images: data.images || [],
      auto_archive_date: data.auto_archive_date || null,
    }

    // Set published_at if status is published
    if (data.status === "published") {
      announcementData.published_at = new Date().toISOString()
    }

    const { data: announcement, error } = await supabase
      .from("announcements")
      .insert(announcementData)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating announcement:", error)
      return { success: false, error: error.message }
    }

    // Handle neighborhood targeting
    if (data.neighborhood_ids && data.neighborhood_ids.length > 0) {
      const neighborhoodInserts = data.neighborhood_ids.map((neighborhoodId) => ({
        announcement_id: announcement.id,
        neighborhood_id: neighborhoodId,
      }))

      const { error: neighborhoodError } = await supabase
        .from("announcement_neighborhoods")
        .insert(neighborhoodInserts)

      if (neighborhoodError) {
        console.error("[v0] Error adding neighborhoods:", neighborhoodError)
      }
    }

    // Send notifications if published
    if (data.status === "published") {
      await sendAnnouncementNotifications(announcement.id, tenantId, tenantSlug, "published")
    }

    revalidatePath(`/t/${tenantSlug}/dashboard`)
    revalidatePath(`/t/${tenantSlug}/dashboard/announcements`)
    revalidatePath(`/t/${tenantSlug}/admin/announcements`)

    return { success: true, data: announcement }
  } catch (error) {
    console.error("[v0] Unexpected error creating announcement:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function updateAnnouncement(
  announcementId: string,
  tenantSlug: string,
  tenantId: string,
  data: Partial<CreateAnnouncementData>,
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("is_tenant_admin, role")
      .eq("id", user.id)
      .single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "tenant_admin" || userData?.role === "super_admin"

    if (!isAdmin) {
      return { success: false, error: "Only tenant admins can update announcements" }
    }

    // Get existing announcement
    const { data: existing, error: fetchError } = await supabase
      .from("announcements")
      .select("id, status, published_at")
      .eq("id", announcementId)
      .eq("tenant_id", tenantId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: "Announcement not found" }
    }

    // Map location_type
    let dbLocationType: string | null = null
    if (data.location_type === "community") {
      dbLocationType = "community_location"
    } else if (data.location_type === "custom") {
      dbLocationType = "custom_temporary"
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.title !== undefined) updateData.title = data.title.trim()
    if (data.description !== undefined) updateData.description = data.description?.trim() || null
    if (data.announcement_type !== undefined) updateData.announcement_type = data.announcement_type
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.event_id !== undefined) updateData.event_id = data.event_id
    if (data.location_type !== undefined) updateData.location_type = dbLocationType
    if (data.location_id !== undefined) updateData.location_id = data.location_id
    if (data.custom_location_name !== undefined) updateData.custom_location_name = data.custom_location_name
    if (data.custom_location_lat !== undefined) updateData.custom_location_lat = data.custom_location_lat
    if (data.custom_location_lng !== undefined) updateData.custom_location_lng = data.custom_location_lng
    if (data.images !== undefined) updateData.images = data.images
    if (data.auto_archive_date !== undefined) updateData.auto_archive_date = data.auto_archive_date

    // Track if editing after initial publish
    const wasPublished = existing.status === "published"
    if (wasPublished && existing.published_at) {
      updateData.last_edited_at = new Date().toISOString()
    }

    const { data: updated, error } = await supabase
      .from("announcements")
      .update(updateData)
      .eq("id", announcementId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating announcement:", error)
      return { success: false, error: error.message }
    }

    // Handle neighborhood updates
    if (data.neighborhood_ids !== undefined) {
      // Delete existing neighborhoods
      await supabase.from("announcement_neighborhoods").delete().eq("announcement_id", announcementId)

      // Insert new neighborhoods
      if (data.neighborhood_ids.length > 0) {
        const neighborhoodInserts = data.neighborhood_ids.map((neighborhoodId) => ({
          announcement_id: announcementId,
          neighborhood_id: neighborhoodId,
        }))

        await supabase.from("announcement_neighborhoods").insert(neighborhoodInserts)
      }
    }

    // Send update notifications if was already published
    if (wasPublished) {
      await sendAnnouncementNotifications(announcementId, tenantId, tenantSlug, "updated")
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/announcements`)
    revalidatePath(`/t/${tenantSlug}/dashboard/announcements/${announcementId}`)
    revalidatePath(`/t/${tenantSlug}/admin/announcements`)

    return { success: true, data: updated }
  } catch (error) {
    console.error("[v0] Unexpected error updating announcement:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function publishAnnouncement(announcementId: string, tenantSlug: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("is_tenant_admin, role")
      .eq("id", user.id)
      .single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "tenant_admin" || userData?.role === "super_admin"

    if (!isAdmin) {
      return { success: false, error: "Only tenant admins can publish announcements" }
    }

    const { error } = await supabase
      .from("announcements")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", announcementId)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("[v0] Error publishing announcement:", error)
      return { success: false, error: error.message }
    }

    // Send notifications
    await sendAnnouncementNotifications(announcementId, tenantId, tenantSlug, "published")

    revalidatePath(`/t/${tenantSlug}/dashboard/announcements`)
    revalidatePath(`/t/${tenantSlug}/admin/announcements`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error publishing announcement:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function archiveAnnouncement(announcementId: string, tenantSlug: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("is_tenant_admin, role")
      .eq("id", user.id)
      .single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "tenant_admin" || userData?.role === "super_admin"

    if (!isAdmin) {
      return { success: false, error: "Only tenant admins can archive announcements" }
    }

    const { error } = await supabase
      .from("announcements")
      .update({
        status: "archived",
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", announcementId)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("[v0] Error archiving announcement:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/announcements`)
    revalidatePath(`/t/${tenantSlug}/admin/announcements`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error archiving announcement:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function deleteAnnouncement(announcementId: string, tenantSlug: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("is_tenant_admin, role")
      .eq("id", user.id)
      .single()

    const isAdmin = userData?.is_tenant_admin || userData?.role === "tenant_admin" || userData?.role === "super_admin"

    if (!isAdmin) {
      return { success: false, error: "Only tenant admins can delete announcements" }
    }

    // Hard delete
    const { error } = await supabase.from("announcements").delete().eq("id", announcementId).eq("tenant_id", tenantId)

    if (error) {
      console.error("[v0] Error deleting announcement:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/announcements`)
    revalidatePath(`/t/${tenantSlug}/admin/announcements`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error deleting announcement:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function markAnnouncementAsRead(announcementId: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Upsert read status
    const { error } = await supabase.from("announcement_reads").upsert(
      {
        announcement_id: announcementId,
        user_id: user.id,
        read_at: new Date().toISOString(),
      },
      {
        onConflict: "announcement_id,user_id",
      },
    )

    if (error) {
      console.error("[v0] Error marking announcement as read:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/announcements`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error marking announcement as read:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getAnnouncements(
  tenantId: string,
  userId: string,
  filters?: {
    status?: "active" | "read" | "archived"
    limit?: number
  },
) {
  try {
    const supabase = await createServerClient()

    const { data: userResident } = await supabase
      .from("residents")
      .select("lot_id, lot:lots(neighborhood_id)")
      .eq("auth_user_id", userId)
      .eq("tenant_id", tenantId)
      .maybeSingle()

    const userNeighborhoodId = userResident?.lot?.neighborhood_id

    // Base query
    let query = supabase
      .from("announcements")
      .select(
        `
        *,
        creator:users!created_by(id, first_name, last_name, profile_picture_url),
        reads:announcement_reads(user_id),
        neighborhoods:announcement_neighborhoods(neighborhood_id)
      `,
      )
      .eq("tenant_id", tenantId)
      .neq("status", "deleted")
      .neq("status", "draft") // Residents only see published/archived

    // Filter by status
    if (filters?.status === "archived") {
      query = query.eq("status", "archived")
    } else {
      // For active/read, we look for published
      query = query.eq("status", "published")
    }

    query = query.or(`auto_archive_date.is.null,auto_archive_date.gte.${new Date().toISOString()}`)

    // Order by published_at desc
    query = query.order("published_at", { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data: announcements, error } = await query

    if (error) {
      console.error("[v0] Error fetching announcements:", error)
      return { success: false, error: error.message }
    }

    // Filter in memory for complex logic (read status + neighborhood targeting)
    const filtered = announcements.filter((a) => {
      // 1. Check neighborhood targeting
      const targetNeighborhoods = a.neighborhoods.map((n: any) => n.neighborhood_id)
      const isCommunityWide = targetNeighborhoods.length === 0
      const isInTarget = isCommunityWide || (userNeighborhoodId && targetNeighborhoods.includes(userNeighborhoodId))

      if (!isInTarget) return false

      // 2. Check read status
      const isRead = a.reads.some((r: any) => r.user_id === userId)

      if (filters?.status === "read") return isRead
      if (filters?.status === "active") return !isRead
      
      return true
    })

    return { success: true, data: filtered }
  } catch (error) {
    console.error("[v0] Unexpected error fetching announcements:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getAllAnnouncementsAdmin(
  tenantId: string,
  filters?: {
    status?: string
    type?: string
    priority?: string
    search?: string
  },
) {
  try {
    const supabase = await createServerClient()

    let query = supabase
      .from("announcements")
      .select(
        `
        *,
        creator:users!created_by(id, first_name, last_name, profile_picture_url),
        neighborhoods:announcement_neighborhoods(neighborhood:neighborhoods(id, name))
      `,
      )
      .eq("tenant_id", tenantId)
      .neq("status", "deleted")
      .order("created_at", { ascending: false })

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.type && filters.type !== "all") {
      query = query.eq("announcement_type", filters.type)
    }

    if (filters?.priority && filters.priority !== "all") {
      query = query.eq("priority", filters.priority)
    }

    if (filters?.search) {
      query = query.ilike("title", `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching admin announcements:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Unexpected error fetching admin announcements:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getAnnouncementById(announcementId: string, tenantId: string) {
  try {
    const supabase = await createServerClient()

    // Fetch announcement with basic relations
    const { data: announcement, error } = await supabase
      .from("announcements")
      .select(
        `
        *,
        creator:users!created_by(id, first_name, last_name, profile_picture_url),
        neighborhoods:announcement_neighborhoods(neighborhood:neighborhoods(id, name)),
        event:events(id, title, start_date, start_time)
      `,
      )
      .eq("id", announcementId)
      .eq("tenant_id", tenantId)
      .single()

    if (error) {
      console.error("[v0] Error fetching announcement details:", error)
      return { success: false, error: error.message }
    }

    // Fetch location details ONLY if needed
    let locationData = null
    if (announcement.location_type === "community_location" && announcement.location_id) {
      const { data: loc } = await supabase
        .from("locations")
        .select("id, name, coordinates")
        .eq("id", announcement.location_id)
        .single()
      
      locationData = loc
    }

    return { 
      success: true, 
      data: { 
        ...announcement, 
        location: locationData 
      } 
    }
  } catch (error) {
    console.error("[v0] Unexpected error fetching announcement details:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Helper function to send notifications
async function sendAnnouncementNotifications(
  announcementId: string,
  tenantId: string,
  tenantSlug: string,
  notificationType: "published" | "updated",
) {
  try {
    const supabase = await createServerClient()

    // Get announcement details
    const { data: announcement } = await supabase
      .from("announcements")
      .select(
        `
        id,
        title,
        announcement_type,
        priority,
        created_by
      `,
      )
      .eq("id", announcementId)
      .single()

    if (!announcement) {
      console.log("[v0] Announcement not found for notifications")
      return
    }

    // Get neighborhood IDs if targeted
    const { data: neighborhoods } = await supabase
      .from("announcement_neighborhoods")
      .select("neighborhood_id")
      .eq("announcement_id", announcementId)

    const neighborhoodIds = neighborhoods?.map((n) => n.neighborhood_id) || []
    const isCommunityWide = neighborhoodIds.length === 0

    console.log("[v0] Sending notifications:", {
      announcementId,
      notificationType,
      isCommunityWide,
      neighborhoodIds,
    })

    // Get target residents
    let recipients: { id: string }[] = []

    if (isCommunityWide) {
      // Community-wide: All resident users in tenant
      const { data: allUsers } = await supabase
        .from("users")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("role", "resident")

      recipients = allUsers || []
    } else {
      // Neighborhood-specific: Users whose lot is in targeted neighborhoods
      const { data: lots } = await supabase
        .from("lots")
        .select("id")
        .eq("tenant_id", tenantId)
        .in("neighborhood_id", neighborhoodIds)

      const lotIds = lots?.map((l) => l.id) || []

      if (lotIds.length > 0) {
        const { data: targetedUsers } = await supabase
          .from("users")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("role", "resident")
          .in("lot_id", lotIds)

        recipients = targetedUsers || []
      }
    }

    console.log("[v0] Found recipients:", recipients.length)

    if (recipients.length === 0) {
      console.log("[v0] No recipients found")
      return
    }

    // Create notifications for each recipient
    const notificationTitle =
      notificationType === "published"
        ? `New ${announcement.announcement_type} announcement`
        : "Announcement updated"

    const notificationMessage = announcement.title

    const notifications = recipients.map((recipient) => ({
      tenant_id: tenantId,
      recipient_id: recipient.id,
      type: notificationType === "published" ? "announcement_published" : "announcement_updated",
      title: notificationTitle,
      message: notificationMessage,
      announcement_id: announcementId,
      actor_id: announcement.created_by,
      action_url: `/t/${tenantSlug}/dashboard/announcements/${announcementId}`,
    }))

    // Batch insert all notifications
    const { error: notifError } = await supabase.from("notifications").insert(notifications)

    if (notifError) {
      console.error("[v0] Error creating notifications:", notifError)
    } else {
      console.log("[v0] Successfully created", notifications.length, "notifications")
    }
  } catch (error) {
    console.error("[v0] Error sending announcement notifications:", error)
  }
}
