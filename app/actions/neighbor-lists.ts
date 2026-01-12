"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type NeighborList = {
    id: string
    name: string
    emoji: string
    description: string | null
    is_shared: boolean
    owner_id: string
    member_count: number
    created_at: string
    members?: {
        id: string
        profile_picture_url: string | null
        first_name: string
        last_name: string
    }[]
}

export type CreateListInput = {
    name: string
    emoji: string
    description?: string
    is_shared?: boolean
}

export async function getNeighborLists(tenantId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // Fetch user's lists and shared family lists
        const { data: lists, error } = await supabase
            .from("neighbor_lists")
            .select(`
                *,
                members:neighbor_list_members(
                    id,
                    neighbor:users!neighbor_list_members_neighbor_id_fkey(
                        id,
                        first_name,
                        last_name,
                        profile_picture_url
                    )
                )
            `)
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("[v0] getNeighborLists db error:", error)
            throw error
        }

        // Transform data to include member count and first few avatars
        const formattedLists = lists.map(list => ({
            ...list,
            member_count: list.members.length,
            // We'll return just the first 5 members for the preview in the list card
            members: list.members
                .map((m: any) => m.neighbor)
                .filter(Boolean) // Filter out null neighbors (deleted users or RLS hidden)
                .slice(0, 5),
            member_ids: list.members
                .map((m: any) => m.neighbor?.id)
                .filter(Boolean)
        }))

        return { success: true, data: formattedLists }
    } catch (error) {
        console.error("Error fetching neighbor lists:", error)
        return { success: false, error: "Failed to fetch lists" }
    }
}

export async function createNeighborList(tenantId: string, input: CreateListInput) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const { data, error } = await supabase
            .from("neighbor_lists")
            .insert({
                tenant_id: tenantId,
                owner_id: user.id,
                name: input.name,
                emoji: input.emoji,
                description: input.description,
                is_shared: input.is_shared ?? false
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath(`/t/${tenantId}/dashboard/neighbours`)
        return { success: true, data }
    } catch (error) {
        console.error("Error creating neighbor list:", error)
        return { success: false, error: "Failed to create list" }
    }
}

export async function updateNeighborList(listId: string, input: Partial<CreateListInput>) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const { data, error } = await supabase
            .from("neighbor_lists")
            .update({
                ...input,
                updated_at: new Date().toISOString()
            })
            .eq("id", listId)
            .select()
            .single()

        if (error) throw error

        revalidatePath(`/t/[slug]/dashboard/neighbours`, 'page') // We don't have slug here, so generic path might be tricky for exact revalidation
        return { success: true, data }
    } catch (error) {
        console.error("Error updating neighbor list:", error)
        return { success: false, error: "Failed to update list" }
    }
}

export async function deleteNeighborList(listId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const { error } = await supabase
            .from("neighbor_lists")
            .delete()
            .eq("id", listId)

        if (error) throw error

        return { success: true }
    } catch (error) {
        console.error("Error deleting neighbor list:", error)
        return { success: false, error: "Failed to delete list" }
    }
}

export async function addNeighborToList(listId: string, neighborId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const { error } = await supabase
            .from("neighbor_list_members")
            .insert({
                list_id: listId,
                neighbor_id: neighborId,
                added_by: user.id
            })

        if (error) {
            // Ignore unique constraint violation (already in list)
            if (error.code === '23505') {
                return { success: true, message: "Already in list" }
            }
            throw error
        }

        return { success: true }
    } catch (error) {
        console.error("Error adding neighbor to list:", error)
        return { success: false, error: "Failed to add neighbor" }
    }
}

export async function removeNeighborFromList(listId: string, neighborId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const { error } = await supabase
            .from("neighbor_list_members")
            .delete()
            .eq("list_id", listId)
            .eq("neighbor_id", neighborId)

        if (error) throw error

        return { success: true }
    } catch (error) {
        console.error("Error removing neighbor from list:", error)
        return { success: false, error: "Failed to remove neighbor" }
    }
}

export async function getNeighborListMembers(listId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const { data, error } = await supabase
            .from("neighbor_list_members")
            .select(`
                *,
                neighbor:users!neighbor_list_members_neighbor_id_fkey(
                    id,
                    first_name,
                    last_name,
                    email,
                    profile_picture_url,
                    bio,
                    lot_id
                )
            `)
            .eq("list_id", listId)
            .order("added_at", { ascending: false })

        if (error) throw error

        const members = data.map((item: any) => ({
            ...item.neighbor,
            added_at: item.added_at,
            added_by: item.added_by
        }))

        return { success: true, data: members }
    } catch (error) {
        console.error("Error fetching list members:", error)
        return { success: false, error: "Failed to fetch members" }
    }
}

export async function batchAddNeighborsToList(listId: string, neighborIds: string[]) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const rows = neighborIds.map(neighborId => ({
            list_id: listId,
            neighbor_id: neighborId,
            added_by: user.id
        }))

        const { error } = await supabase
            .from("neighbor_list_members")
            .upsert(rows, { onConflict: 'list_id, neighbor_id', ignoreDuplicates: true })

        if (error) throw error

        return { success: true }
    } catch (error) {
        console.error("Error batch adding neighbors:", error)
        return { success: false, error: "Failed to add neighbors" }
    }
}

export async function getListsForNeighbor(neighborId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const { data, error } = await supabase
            .from("neighbor_list_members")
            .select("list_id")
            .eq("neighbor_id", neighborId)

        if (error) throw error

        return { success: true, data: data.map(row => row.list_id) }
    } catch (error) {
        console.error("Error fetching lists for neighbor:", error)
        return { success: false, error: "Failed to fetch lists" }
    }
}
