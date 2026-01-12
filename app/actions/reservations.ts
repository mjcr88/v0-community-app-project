"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"
import { addHours, isBefore, endOfDay } from "date-fns"

export async function createReservation(
    data: {
        location_id: string
        start_time: string // ISO string
        end_time: string // ISO string
        title: string
        notes?: string
    },
    tenantSlug: string
) {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        console.error("createReservation: Unauthorized - No user found")
        throw new Error("Unauthorized")
    }
    console.log("createReservation: Starting for user", user.id, "location", data.location_id)

    const startTime = new Date(data.start_time)
    const endTime = new Date(data.end_time)
    const now = new Date()

    // 1. Basic Validation
    if (isBefore(startTime, now)) {
        throw new Error("Cannot reserve in the past")
    }

    if (isBefore(endTime, startTime)) {
        throw new Error("End time must be after start time")
    }

    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    if (durationHours > 2) {
        throw new Error("Reservation cannot exceed 2 hours")
    }

    if (!data.title || data.title.trim().length === 0) {
        throw new Error("Title is required")
    }

    if (data.title.length > 50) {
        throw new Error("Title must be less than 50 characters")
    }

    // 2. Check Facility Status & proper tenant & feature flag
    const { data: facility, error: facilityError } = await supabase
        .from("locations")
        .select(`
            is_reservable, 
            name, 
            tenant_id,
            tenant:tenants (
                reservations_enabled
            )
        `)
        .eq("id", data.location_id)
        .single()

    if (facilityError || !facility) {
        throw new Error("Facility not found")
    }

    if (!facility.is_reservable) {
        throw new Error("This facility is not reservable")
    }

    if (!facility.is_reservable) {
        throw new Error("This facility is not reservable")
    }

    // Check if feature is enabled for tenant
    // @ts-ignore - supabase types might not be fully updated locally but query handles it
    if (facility.tenant && !facility.tenant.reservations_enabled) {
        throw new Error("Reservations are not enabled for this community")
    }

    // 3. Check User Limits (Max 2 active/future reservations)
    const { count, error: countError } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .gte("end_time", now.toISOString()) // Future active reservations

    if (countError) {
        console.error("Error checking limits:", countError)
        throw new Error("Failed to check reservation limits")
    }

    if (count !== null && count >= 2) {
        throw new Error("You have reached the limit of 2 active reservations")
    }

    // 4. Check Conflicts (Overlapping reservations)
    // range overlap: (StartA <= EndB) and (EndA >= StartB)
    // we look for ANY reservation for this location that overlaps
    const { data: conflicts, error: conflictError } = await supabase
        .from("reservations")
        .select("id")
        .eq("location_id", data.location_id)
        .eq("status", "confirmed")
        .lte("start_time", data.end_time)
        .gte("end_time", data.start_time)

    if (conflictError) {
        console.error("Error checking conflicts:", conflictError)
        throw new Error("Failed to check availability")
    }

    if (conflicts && conflicts.length > 0) {
        throw new Error("This time slot is already reserved")
    }

    // 5. Create Reservation
    const { data: reservation, error: createError } = await supabase
        .from("reservations")
        .insert({
            location_id: data.location_id,
            user_id: user.id,
            tenant_id: facility.tenant_id,
            start_time: data.start_time,
            end_time: data.end_time,
            status: "confirmed", // Auto-confirm
            title: data.title,
            notes: data.notes,
        })
        .select()
        .single()

    if (createError) {
        console.error("Error creating reservation:", createError)
        throw new Error("Failed to create reservation")
    }

    console.log("createReservation: Success, reservation created", reservation.id)

    // 6. Notify User
    try {
        await createNotification({
            tenant_id: facility.tenant_id,
            recipient_id: user.id,
            type: "system_alert",
            title: "Reservation Confirmed",
            message: `Your reservation for ${facility.name} on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()} has been confirmed.`,
            action_url: `/t/${tenantSlug}/dashboard`,
        })
    } catch (notifyError) {
        console.error("createReservation: Failed to send notification (non-critical)", notifyError)
    }

    revalidatePath(`/t/${tenantSlug}/admin/reservations`, 'page')
    // revalidatePath(`/t/${tenantSlug}/dashboard`, "layout") // TOO BROAD
    revalidatePath(`/t/${tenantSlug}/dashboard/locations/${data.location_id}`, "page")

    return reservation
}

export async function cancelReservation(reservationId: string, reason: string, tenantSlug: string) {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // Get reservation to verify ownership or admin status
    const { data: reservation } = await supabase
        .from("reservations")
        .select("*, location:locations(name)")
        .eq("id", reservationId)
        .single()

    if (!reservation) {
        throw new Error("Reservation not found")
    }

    // Check permissions: Owner or Tenant Admin
    const isOwner = reservation.user_id === user.id

    // We need to check if user is admin if not owner
    let isAdmin = false
    if (!isOwner) {
        const { data: userData } = await supabase
            .from("users")
            .select("is_tenant_admin, role")
            .eq("id", user.id)
            .single()

        isAdmin = userData?.is_tenant_admin || userData?.role === 'tenant_admin' || userData?.role === 'super_admin'
    }

    if (!isOwner && !isAdmin) {
        throw new Error("Unauthorized to cancel this reservation")
    }

    const { error } = await supabase
        .from("reservations")
        .update({
            status: "cancelled",
            cancellation_reason: reason
        })
        .eq("id", reservationId)

    if (error) {
        throw new Error("Failed to cancel reservation")
    }

    // Notify if admin cancelled user's reservation
    if (!isOwner && isAdmin) {
        await createNotification({
            recipient_id: reservation.user_id,
            type: "system_alert",
            title: "Reservation Cancelled",
            message: `Your reservation for ${reservation.location?.name} has been cancelled by an administrator. Reason: ${reason}`,
            tenant_id: reservation.tenant_id,
            action_url: `/t/${tenantSlug}/dashboard`
        })
    }

    revalidatePath(`/t/${tenantSlug}/admin/reservations`, 'page')
    revalidatePath(`/t/${tenantSlug}/dashboard/locations/${reservation.location_id}`, 'page')
    // We can also revalidate the specific user's dashboard if needed, but 'layout' is too broad.
    // Instead of revalidating everything, let's just stick to the specific pages we know about.
}

export async function getUserReservations() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data } = await supabase
        .from("reservations")
        .select(`
            *,
            location:locations (
                id,
                name,
                type,
                photos
            )
        `)
        .eq("user_id", user.id)
        .neq("status", "cancelled")
        .gte("end_time", new Date().toISOString())
        .order("start_time", { ascending: true }) // Upcoming first

    return data || []
}
