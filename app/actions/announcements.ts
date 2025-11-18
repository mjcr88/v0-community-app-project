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

    if (!announcement) return

    // Get neighborhood IDs if targeted
    const { data: neighborhoods } = await supabase
      .from("announcement_neighborhoods")
      .select("neighborhood_id")
      .eq("announcement_id", announcementId)

    const neighborhoodIds = neighborhoods?.map((n) => n.neighborhood_id) || []

    // Get target residents
    let recipientQuery = supabase.from("users").select("id").eq("tenant_id", tenantId)

    // If neighborhood-specific, filter by lot -> neighborhood
    if (neighborhoodIds.length > 0) {
      const { data: lots } = await supabase.from("lots").select("id").in("neighborhood_id", neighborhoodIds)

      const lotIds = lots?.map((l) => l.id) || []
      recipientQuery = recipientQuery.in("lot_id", lotIds)
    }

    const { data: recipients } = await recipientQuery

    if (!recipients || recipients.length === 0) return

    // Create notifications for each recipient
    const notificationTitle =
      notificationType === "published" ? `New ${announcement.announcement_type} announcement` : "Announcement updated"

    const notificationMessage = announcement.title

    await Promise.all(
      recipients.map((recipient) =>
        createNotification({
          tenant_id: tenantId,
          recipient_id: recipient.id,
          type: notificationType === "published" ? "announcement_published" : "announcement_updated",
          title: notificationTitle,
          message: notificationMessage,
          announcement_id: announcementId,
          actor_id: announcement.created_by,
          action_url: `/t/${tenantSlug}/dashboard/announcements/${announcementId}`,
        }),
      ),
    )
  } catch (error) {
    console.error("[v0] Error sending announcement notifications:", error)
  }
}

export async function archiveAnnouncements(announcementIds: string[], tenantId: string, tenantSlug: string) {
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
      .in("id", announcementIds)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("[v0] Error archiving announcements:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/announcements`)
    revalidatePath(`/t/${tenantSlug}/admin/announcements`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error archiving announcements:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function deleteAnnouncements(announcementIds: string[], tenantId: string, tenantSlug: string) {
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
    const { error } = await supabase
      .from("announcements")
      .delete()
      .in("id", announcementIds)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("[v0] Error deleting announcements:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/announcements`)
    revalidatePath(`/t/${tenantSlug}/admin/announcements`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error deleting announcements:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function publishAnnouncements(announcementIds: string[], tenantId: string, tenantSlug: string) {
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
      .in("id", announcementIds)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("[v0] Error publishing announcements:", error)
      return { success: false, error: error.message }
    }

    // Send notifications for each announcement
    await Promise.all(
      announcementIds.map((id) => sendAnnouncementNotifications(id, tenantId, tenantSlug, "published"))
    )

    revalidatePath(`/t/${tenantSlug}/dashboard/announcements`)
    revalidatePath(`/t/${tenantSlug}/admin/announcements`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error publishing announcements:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}
