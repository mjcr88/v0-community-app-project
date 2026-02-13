"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// Service role client bypasses RLS - use carefully with proper permission checks
function createServiceRoleClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}

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

export async function createFamilyMember(
    tenantSlug: string,
    tenantId: string,
    familyUnitId: string,
    data: {
        firstName: string
        lastName: string
        email?: string
        phone?: string
        birthday?: string
        relationshipType?: string
        profilePictureUrl?: string
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

        // 1. Check permissions
        const { data: userData } = await supabase
            .from("users")
            .select("is_tenant_admin, tenant_id, role, family_unit_id, lot_id")
            .eq("id", user.id)
            .single()

        const { data: familyUnit } = await supabase
            .from("family_units")
            .select("primary_contact_id, tenant_id")
            .eq("id", familyUnitId)
            .single()

        if (!familyUnit) {
            return { success: false, error: "Family unit not found" }
        }

        const isSuperAdmin = userData?.role === 'super_admin'
        const isTenantAdminRole = userData?.role === 'tenant_admin' && userData?.tenant_id === tenantId
        const isResidentAdmin = userData?.is_tenant_admin && userData?.tenant_id === tenantId
        const isPrimaryContact = familyUnit.primary_contact_id === user.id

        // 2. Identify Lot ID - ALWAYS use primary contact's lot for family consistency
        let targetLotId: string | null = null

        if (familyUnit.primary_contact_id) {
            const { data: primaryContact } = await supabase
                .from("users")
                .select("lot_id")
                .eq("id", familyUnit.primary_contact_id)
                .single()
            targetLotId = primaryContact?.lot_id || null
        }

        // Fallback to current user's lot only if no primary contact
        if (!targetLotId) {
            targetLotId = userData?.lot_id || null
        }

        console.log("[DEBUG RLS] createFamilyMember request:", {
            userId: user.id,
            tenantId,
            familyUnitId,
            targetLotId,
            data
        })

        // Allow if admin OR if primary contact of THIS family
        const hasPermission = isSuperAdmin || isTenantAdminRole || isResidentAdmin || isPrimaryContact

        console.log("[DEBUG RLS] Permission check:", {
            hasPermission,
            isSuperAdmin,
            isTenantAdminRole,
            isResidentAdmin,
            isPrimaryContact,
            primary_contact_id: familyUnit.primary_contact_id
        })

        if (!hasPermission) {
            return { success: false, error: "Unauthorized - only primary contact or admin can add members" }
        }

        if (!targetLotId) {
            return { success: false, error: "Could not determine Lot for new family member" }
        }

        // 3. Create User (Passive or Active) - Use service role to bypass RLS
        // Permission has already been validated above
        const serviceClient = createServiceRoleClient()
        const { data: newMember, error: createError } = await serviceClient
            .from("users")
            .insert({
                tenant_id: tenantId,
                lot_id: targetLotId,
                family_unit_id: familyUnitId,
                role: "resident",
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email || null,
                phone: data.phone || null,
                birthday: data.birthday || null,
                profile_picture_url: data.profilePictureUrl || null,
                onboarding_completed: false,
                journey_stage: 'arriving'
            })
            .select()
            .single()

        if (createError) {
            console.error("Error creating family member:", createError)
            if (createError.code === '23505' && createError.message.includes('email')) {
                return { success: false, error: "A user with this email already exists." }
            }
            return { success: false, error: createError.message }
        }

        // 4. Create Relationship (Optional)
        if (data.relationshipType) {
            const { error: relError } = await supabase
                .from("family_relationships")
                .insert({
                    tenant_id: tenantId,
                    user_id: user.id,
                    related_user_id: newMember.id,
                    relationship_type: data.relationshipType
                })

            if (relError) {
                console.error("Error creating relationship:", relError)
            }
        }

        revalidatePath(`/t/${tenantSlug}/dashboard/settings/family`)
        return { success: true, member: newMember }

    } catch (error) {
        console.error("Unexpected error adding family member:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Request app access for a passive family member.
 * Creates a resident_request with type 'account_access' for admin review.
 */
export async function requestAccountAccess(
    tenantSlug: string,
    tenantId: string,
    passiveMemberId: string,
    email: string
) {
    try {
        const supabase = await createServerClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: "User not authenticated" }
        }

        // Get the passive member details
        const { data: passiveMember } = await supabase
            .from("users")
            .select("id, first_name, last_name, family_unit_id, tenant_id, email")
            .eq("id", passiveMemberId)
            .single()

        if (!passiveMember) {
            return { success: false, error: "Family member not found" }
        }

        if (passiveMember.email) {
            return { success: false, error: "This member already has an email associated. They can use the forgot password flow." }
        }

        // Verify requester is primary contact or admin
        const { data: requester } = await supabase
            .from("users")
            .select("id, role, is_tenant_admin, tenant_id, family_unit_id")
            .eq("id", user.id)
            .single()

        const isSuperAdmin = requester?.role === 'super_admin'
        const isTenantAdmin = requester?.role === 'tenant_admin' && requester?.tenant_id === tenantId
        const isResidentAdmin = requester?.is_tenant_admin && requester?.tenant_id === tenantId

        // Check if requester is primary contact of the same family
        const { data: familyUnit } = await supabase
            .from("family_units")
            .select("primary_contact_id")
            .eq("id", passiveMember.family_unit_id)
            .single()

        const isPrimaryContact = familyUnit?.primary_contact_id === user.id

        if (!isSuperAdmin && !isTenantAdmin && !isResidentAdmin && !isPrimaryContact) {
            return { success: false, error: "Only the primary contact or admin can request access for family members" }
        }

        // Save the requested email to the passive user account so admin can see it
        const serviceClient = createServiceRoleClient()
        const { error: updateError } = await serviceClient
            .from("users")
            .update({ email: email })
            .eq("id", passiveMemberId)

        if (updateError) {
            console.error("Error saving email to passive user:", updateError)
            return { success: false, error: updateError.message }
        }

        // Create the request for admin review
        const { data: request, error: requestError } = await serviceClient
            .from("resident_requests")
            .insert({
                tenant_id: tenantId,
                created_by: user.id,
                original_submitter_id: user.id,
                title: `App Access Request for ${passiveMember.first_name} ${passiveMember.last_name}`,
                request_type: 'account_access',
                description: `Resident ${passiveMember.first_name} ${passiveMember.last_name} is requesting app access. Please assign the email below and send an invitation.`,
                priority: 'normal',
                status: 'pending',
                is_anonymous: false,
                images: [],
                tagged_resident_ids: [passiveMemberId],
                tagged_pet_ids: [],
                // Store requested email for admin to use
                admin_internal_notes: JSON.stringify({
                    requested_email: email,
                    passive_member_id: passiveMemberId
                })
            })
            .select()
            .single()

        if (requestError) {
            console.error("Error creating account access request:", requestError)
            return { success: false, error: requestError.message }
        }

        revalidatePath(`/t/${tenantSlug}/dashboard/settings/family`)
        revalidatePath(`/t/${tenantSlug}/admin/requests`)
        return { success: true, request }

    } catch (error) {
        console.error("Unexpected error requesting account access:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Add an existing resident to a family unit.
 * Used when a user already exists (e.g. from a lot) but needs to be added to a family.
 */
export async function addExistingFamilyMember(
    tenantSlug: string,
    tenantId: string,
    familyUnitId: string,
    data: {
        residentId: string
        relationshipType?: string
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

        // 1. Check permissions
        const { data: userData } = await supabase
            .from("users")
            .select("is_tenant_admin, tenant_id, role")
            .eq("id", user.id)
            .single()

        const { data: familyUnit } = await supabase
            .from("family_units")
            .select("primary_contact_id, tenant_id")
            .eq("id", familyUnitId)
            .single()

        if (!familyUnit) {
            return { success: false, error: "Family unit not found" }
        }

        // Verify tenant scope
        if (familyUnit.tenant_id !== tenantId) {
            return { success: false, error: "Family unit belongs to a different tenant" }
        }

        const isSuperAdmin = userData?.role === 'super_admin'
        const isTenantAdminRole = userData?.role === 'tenant_admin' && userData?.tenant_id === tenantId
        const isResidentAdmin = userData?.is_tenant_admin && userData?.tenant_id === tenantId
        const isPrimaryContact = familyUnit.primary_contact_id === user.id

        // Allow if admin OR if primary contact of THIS family
        const hasPermission = isSuperAdmin || isTenantAdminRole || isResidentAdmin || isPrimaryContact

        if (!hasPermission) {
            return { success: false, error: "Unauthorized - only primary contact or admin can add members" }
        }

        // 2. Validate Target User
        const { data: targetUser } = await supabase
            .from("users")
            .select("id, tenant_id, family_unit_id")
            .eq("id", data.residentId)
            .single()

        if (!targetUser) {
            return { success: false, error: "Resident not found" }
        }

        if (targetUser.tenant_id !== tenantId) {
            return { success: false, error: "Resident belongs to a different tenant" }
        }

        if (targetUser.family_unit_id) {
            return { success: false, error: "Resident is already part of a family unit" }
        }

        // 3. Update User - Use service role to bypass RLS for update
        const serviceClient = createServiceRoleClient()
        const { error: updateError } = await serviceClient
            .from("users")
            .update({
                family_unit_id: familyUnitId,
                role: 'resident', // Ensure they have resident role
                // onboarding_completed: false // REMOVED: Preserve existing onboarding state
            })
            .eq("id", data.residentId)

        if (updateError) {
            console.error("Error adding existing family member:", updateError)
            return { success: false, error: updateError.message }
        }

        // 4. Create Relationship (Optional)
        if (data.relationshipType) {
            const { error: relError } = await supabase
                .from("family_relationships")
                .insert({
                    tenant_id: tenantId,
                    user_id: user.id, // The person adding (primary contact)
                    related_user_id: data.residentId,
                    relationship_type: data.relationshipType
                })

            if (relError) {
                console.error("Error creating relationship:", relError)
                // Don't fail total operation for this
            }
        }

        revalidatePath(`/t/${tenantSlug}/dashboard/settings/family`)
        revalidatePath(`/t/${tenantSlug}/admin/families`)

        return { success: true }

    } catch (error) {
        console.error("Unexpected error adding existing family member:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}
