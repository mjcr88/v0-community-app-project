"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createFamilyUnit(
    tenantSlug: string,
    tenantId: string,
    data: {
        familyName: string
        mode: "existing" | "new"
        selectedResidentIds?: string[]
        selectedLotId?: string
        members?: Array<{
            first_name: string
            last_name: string
            email: string
            phone: string
        }>
        pets?: Array<{
            name: string
            species: string
            breed: string
        }>
        primaryContactIndex?: number
    }
) {
    try {
        const supabase = await createServerClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: "User not authenticated" }
        }

        // Check if user is tenant admin or super admin
        const { data: userData } = await supabase
            .from("users")
            .select("is_tenant_admin, tenant_id, role")
            .eq("id", user.id)
            .single()

        const isSuperAdmin = userData?.role === 'super_admin'
        const isTenantAdminRole = userData?.role === 'tenant_admin' && userData?.tenant_id === tenantId
        const isResidentAdmin = userData?.is_tenant_admin && userData?.tenant_id === tenantId

        if (!userData || (!isSuperAdmin && !isTenantAdminRole && !isResidentAdmin)) {
            return { success: false, error: "Unauthorized - admin access required" }
        }

        if (!data.familyName || !data.familyName.trim()) {
            return { success: false, error: "Family name is required" }
        }

        if (data.mode === "existing") {
            if (!data.selectedResidentIds || data.selectedResidentIds.length === 0) {
                return { success: false, error: "At least one resident must be selected" }
            }

            // Create family unit without primary contact first
            const { data: family, error: familyError } = await supabase
                .from("family_units")
                .insert({
                    tenant_id: tenantId,
                    name: data.familyName,
                })
                .select()
                .single()

            if (familyError) {
                console.error("Error creating family unit:", familyError)
                return { success: false, error: familyError.message }
            }

            // Update residents with family_unit_id
            const { error: updateError } = await supabase
                .from("users")
                .update({ family_unit_id: family.id })
                .in("id", data.selectedResidentIds)

            if (updateError) {
                console.error("Error assigning residents to family:", updateError)
                // Try to clean up
                await supabase.from("family_units").delete().eq("id", family.id)
                return { success: false, error: updateError.message }
            }

            // Set primary contact
            const primaryContactId = data.selectedResidentIds[0]
            if (primaryContactId) {
                const { error: primaryError } = await supabase
                    .from("family_units")
                    .update({ primary_contact_id: primaryContactId })
                    .eq("id", family.id)

                if (primaryError) {
                    console.error("Error setting primary contact:", primaryError)
                    // We don't fail the whole operation here, as the family and members are created
                }
            }

            revalidatePath(`/t/${tenantSlug}/admin/families`)
            return { success: true, familyId: family.id }
        } else {
            // New members mode
            if (!data.selectedLotId) {
                return { success: false, error: "Lot selection is required for new members" }
            }

            if (!data.members || data.members.length === 0) {
                return { success: false, error: "At least one family member is required" }
            }

            // Create family unit without primary contact first
            const { data: family, error: familyError } = await supabase
                .from("family_units")
                .insert({
                    tenant_id: tenantId,
                    name: data.familyName,
                })
                .select()
                .single()

            if (familyError) {
                console.error("Error creating family unit:", familyError)
                return { success: false, error: familyError.message }
            }

            // Create new residents
            const residentsToInsert = data.members.map((member) => ({
                tenant_id: tenantId,
                lot_id: data.selectedLotId,
                family_unit_id: family.id,
                role: "resident" as const,
                first_name: member.first_name,
                last_name: member.last_name,
                email: member.email || null,
                phone: member.phone || null,
                onboarding_completed: false,
            }))

            const { data: createdResidents, error: residentsError } = await supabase
                .from("users")
                .insert(residentsToInsert)
                .select()

            if (residentsError) {
                console.error("Error creating residents:", residentsError)
                // Clean up the family unit if resident creation fails
                await supabase.from("family_units").delete().eq("id", family.id)
                return { success: false, error: residentsError.message }
            }

            // Update family with primary contact
            if (createdResidents && createdResidents.length > 0) {
                const primaryContactIndex = data.primaryContactIndex || 0
                const primaryContactId = createdResidents[primaryContactIndex]?.id

                if (primaryContactId) {
                    await supabase
                        .from("family_units")
                        .update({ primary_contact_id: primaryContactId })
                        .eq("id", family.id)
                }
            }

            // Create pets if provided
            if (data.pets && data.pets.length > 0) {
                const petsToInsert = data.pets.map((pet) => ({
                    tenant_id: tenantId,
                    lot_id: data.selectedLotId!,
                    family_unit_id: family.id,
                    name: pet.name,
                    species: pet.species,
                    breed: pet.breed || null,
                }))

                const { error: petsError } = await supabase.from("pets").insert(petsToInsert)

                if (petsError) {
                    console.error("Error creating pets:", petsError)
                    // Don't fail the whole operation if pets fail
                }
            }

            revalidatePath(`/t/${tenantSlug}/admin/families`)
            return { success: true, familyId: family.id }
        }
    } catch (error) {
        console.error("Unexpected error creating family unit:", error)
        return {
            success: false,
            error: "An unexpected error occurred. Please try again.",
        }
    }
}
