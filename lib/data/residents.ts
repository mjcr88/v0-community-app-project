import { createServerClient } from "@/lib/supabase/server"
import { cache } from 'react'

export interface Resident {
    id: string
    first_name: string
    last_name: string
    email: string | null
    profile_picture_url: string | null
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
    profile_picture_url,
    role,
    tenant_id,
    family_unit_id,
    lot_id,
    created_at,
    updated_at
    `

    if (enrichWithFamily) {
        selectQuery += `,
    family_units: family_unit_id(id, name)
        `
    }

    if (enrichWithLot) {
        selectQuery += `,
        lots: lot_id(id, lot_number, address)
    `
    }

    let query = supabase.from("users").select(selectQuery).eq("tenant_id", tenantId)

    // Apply filters
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
        console.error("[get-residents] Error fetching residents:", {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        })
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
            profile_picture_url: resident.profile_picture_url,
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

export const getResidentById = cache(async (
    userId: string,
    options: { enrichWithFamily?: boolean; enrichWithLot?: boolean } = {},
): Promise<ResidentWithRelations | null> => {
    console.log('[DEBUG] getResidentById called:', { userId, options })

    const supabase = await createServerClient()

    // First get the user's tenant_id
    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", userId)
        .single()

    console.log('[DEBUG] User tenant lookup:', { userId, userData, userError })

    if (!userData?.tenant_id) {
        console.log('[DEBUG] No tenant_id found for user, returning null')
        return null
    }

    const results = await getResidents(userData.tenant_id, { ...options })
    const residents = results.filter(r => r.id === userId)

    console.log('[DEBUG] getResidentById results:', {
        userId,
        tenantId: userData.tenant_id,
        foundCount: residents.length,
        resident: residents[0] ? { id: residents[0].id, name: `${residents[0].first_name} ${residents[0].last_name}` } : null
    })


    return residents.length > 0 ? residents[0] : null
})
