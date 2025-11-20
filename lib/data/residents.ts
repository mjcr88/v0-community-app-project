import { createServerClient } from "@/lib/supabase/server"
import { cache } from 'react'

export interface Resident {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone_number: string | null
    profile_picture_url: string | null
    bio: string | null
    status: 'active' | 'inactive' | 'pending'
    role: 'resident' | 'tenant_admin' | 'super_admin'
    tenant_id: string
    family_unit_id: string | null
    lot_id: string | null
    created_at: string
    updated_at: string
}

export interface ResidentWithRelations extends Resident {
    family_unit?: {
        id: string
        name: string
    } | null
    lot?: {
        id: string
        lot_number: string
        address: string | null
    } | null
}

export interface GetResidentsOptions {
    // Filter options
    status?: ('active' | 'inactive' | 'pending')[]
    role?: ('resident' | 'tenant_admin' | 'super_admin')[]
    familyUnitId?: string
    lotId?: string
    search?: string

    // Enrichment options
    enrichWithFamily?: boolean
    enrichWithLot?: boolean
}

/**
 * Unified query function for fetching residents with optional enrichment
 */
export const getResidents = cache(async (
    tenantId: string,
    options: GetResidentsOptions = {},
): Promise<ResidentWithRelations[]> => {
    const {
        status,
        role,
        familyUnitId,
        lotId,
        search,
        enrichWithFamily = false,
        enrichWithLot = false,
    } = options

    const supabase = await createServerClient()

    // Build the select query
    let selectQuery = `
    id,
    first_name,
    last_name,
    email,
    phone_number,
    profile_picture_url,
    bio,
    status,
    role,
    tenant_id,
    family_unit_id,
    lot_id,
    created_at,
    updated_at
  `

    if (enrichWithFamily) {
        selectQuery += `,
      family_units:family_unit_id(id, name)
    `
    }

    if (enrichWithLot) {
        selectQuery += `,
      lots:lot_id(id, lot_number, address)
    `
    }

    let query = supabase.from("users").select(selectQuery).eq("tenant_id", tenantId)

    // Apply filters
    if (status && status.length > 0) {
        query = query.in("status", status)
    }

    if (role && role.length > 0) {
        query = query.in("role", role)
    } else {
        // Default to residents if no role specified, but allow overriding
        query = query.eq("role", "resident")
    }

    if (familyUnitId) {
        query = query.eq("family_unit_id", familyUnitId)
    }

    if (lotId) {
        query = query.eq("lot_id", lotId)
    }

    if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: residents, error } = await query.order("last_name", { ascending: true })

    if (error) {
        console.error("[get-residents] Error fetching residents:", error)
        return []
    }

    if (!residents || residents.length === 0) {
        return []
    }

    // Transform data
    return residents.map((resident: any) => {
        const base: ResidentWithRelations = {
            id: resident.id,
            first_name: resident.first_name,
            last_name: resident.last_name,
            email: resident.email,
            phone_number: resident.phone_number,
            profile_picture_url: resident.profile_picture_url,
            bio: resident.bio,
            status: resident.status,
            role: resident.role,
            tenant_id: resident.tenant_id,
            family_unit_id: resident.family_unit_id,
            lot_id: resident.lot_id,
            created_at: resident.created_at,
            updated_at: resident.updated_at,
        }

        if (enrichWithFamily && resident.family_units) {
            base.family_unit = resident.family_units
        }

        if (enrichWithLot && resident.lots) {
            base.lot = resident.lots
        }

        return base
    })
})

export async function getResidentById(
    residentId: string,
    options: GetResidentsOptions = {},
): Promise<ResidentWithRelations | null> {
    const supabase = await createServerClient()

    const { data: resident } = await supabase.from("users").select("tenant_id").eq("id", residentId).single()

    if (!resident) {
        return null
    }

    const residents = await getResidents(resident.tenant_id, {
        ...options,
        // Override filters to ensure we find the specific user regardless of other filters
        role: undefined
    })

    return residents.find((r) => r.id === residentId) || null
}
