"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { NotificationType, CreateNotificationData, NotificationFilters } from "@/types/notifications"

/**
 * Server actions for notifications
 */

export async function getNotifications(tenantId: string, filters?: NotificationFilters) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    let query = supabase
      .from("notifications")
      .select(
        `
        *,
        actor:users!actor_id(
          id,
          first_name,
          last_name,
          profile_picture_url
        ),
        exchange_listing:exchange_listings!exchange_listing_id(
          id,
          title,
          hero_photo,
          category:exchange_categories(id, name)
        ),
        exchange_transaction:exchange_transactions!exchange_transaction_id(
          id,
          quantity,
          status,
          proposed_pickup_date,
          proposed_return_date,
          expected_return_date,
          actual_return_date,
          return_condition,
          return_notes
        ),
        event:events!event_id(
          id,
          title,
          start_date,
          start_time,
          end_date,
          end_time,
          is_all_day,
          location_id,
          custom_location_name,
          category:event_categories(id, name, icon)
        ),
        check_in:check_ins!check_in_id(
          id,
          title,
          activity_type,
          start_time,
          duration_minutes,
          location_id,
          custom_location_name
        ),
        document:documents!document_id(
          id,
          title,
          category,
          document_type
        )
      `,
      )
      .eq("recipient_id", user.id)
      .eq("tenant_id", tenantId)

    // Apply filters
    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        query = query.in("type", filters.type)
      } else {
        query = query.eq("type", filters.type)
      }
    }

    if (filters?.is_read !== undefined) {
      query = query.eq("is_read", filters.is_read)
    }

    if (filters?.is_archived !== undefined) {
      query = query.eq("is_archived", filters.is_archived)
    }

    if (filters?.action_required !== undefined) {
      query = query.eq("action_required", filters.action_required)
    }

    if (filters?.action_taken !== undefined) {
      query = query.eq("action_taken", filters.action_taken)
    }

    const { data: notifications, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching notifications:", error)
      return []
    }

    return notifications || []
  } catch (error) {
    console.error("[v0] Unexpected error fetching notifications:", error)
    return []
  }
}

export async function getUnreadCount(tenantId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return 0
    }

    const { data: count, error } = await supabase.rpc("get_unread_notification_count", {
      p_user_id: user.id,
    })

    if (error) {
      console.error("[v0] Error fetching unread count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("[v0] Unexpected error fetching unread count:", error)
    return 0
  }
}

export async function markAsRead(notificationId: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("recipient_id", user.id)

    if (error) {
      console.error("[v0] Error marking notification as read:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/notifications`)
    revalidatePath(`/t/${tenantSlug}/dashboard`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error marking notification as read:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function markAllAsRead(tenantId: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("recipient_id", user.id)
      .eq("tenant_id", tenantId)
      .eq("is_read", false)

    if (error) {
      console.error("[v0] Error marking all notifications as read:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/notifications`)
    revalidatePath(`/t/${tenantSlug}/dashboard`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error marking all notifications as read:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function archiveNotification(notificationId: string, tenantSlug: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_archived: true,
      })
      .eq("id", notificationId)
      .eq("recipient_id", user.id)

    if (error) {
      console.error("[v0] Error archiving notification:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/notifications`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error archiving notification:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

/**
 * Internal helper function to create notifications
 * Called by other server actions (e.g., exchange transactions, events)
 */
export async function createNotification(data: CreateNotificationData) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.from("notifications").insert({
      tenant_id: data.tenant_id,
      recipient_id: data.recipient_id,
      type: data.type,
      title: data.title,
      message: data.message || null,
      action_required: data.action_required || false,
      exchange_transaction_id: data.exchange_transaction_id || null,
      exchange_listing_id: data.exchange_listing_id || null,
      event_id: data.event_id || null,
      check_in_id: data.check_in_id || null,
      document_id: data.document_id || null,
      actor_id: data.actor_id || null,
      action_url: data.action_url || null,
      metadata: data.metadata || null,
    })

    if (error) {
      console.error("[v0] Error creating notification:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error creating notification:", error)
    return {
      success: false,
      error: "An unexpected error occurred creating notification.",
    }
  }
}
