import { createServerClient } from "@/lib/supabase/server"
import { cache } from 'react'

export interface FamilyUnit {
    id: string
    name: string
    description: string | null
    profile_picture_url: string | null
    banner_image_url: string | null
    primary_contact_id: string | null
    photos: string[] | null
    hero_photo: string | null
    tenant_id: string
    created_at: string
    updated_at: string
}

export interface FamilyUnitWithRelations extends FamilyUnit {
    members?: {
        id: string
        first_name: string
        last_name: string
        profile_picture_url: string | null
        role: string
    }[]
    pets?: {
        id: string
        name: string
        species: string
        profile_picture_url: string | null
    }[]
}

export interface GetFamiliesOptions {
    // Filter options
    search?: string

    // Enrichment options
    enrichWithMembers?: boolean
    enrichWithPets?: boolean
}

export const getFamilies = cache(async (
    tenantId: string,
    options: GetFamiliesOptions = {},
): Promise<FamilyUnitWithRelations[]> => {
    const {
        search,
        enrichWithMembers = false,
        enrichWithPets = false,
    } = options

    const supabase = await createServerClient()

    let selectQuery = `
    id,
    name,
    description,
    profile_picture_url,
    banner_image_url,
    primary_contact_id,
    photos,
    hero_photo,
    tenant_id,
    created_at,
    updated_at
  `

    if (enrichWithMembers) {
        selectQuery += `,
      members:users!users_family_unit_id_fkey(id, first_name, last_name, profile_picture_url, role)
    `
    }

    if (enrichWithPets) {
        selectQuery += `,
      pets(id, name, species, breed, profile_picture_url)
    `
    }

    let query = supabase.from("family_units").select(selectQuery).eq("tenant_id", tenantId)

    if (search) {
        query = query.ilike("name", `%${search}%`)
    }

    const { data: families, error } = await query.order("name", { ascending: true })

    if (error) {
        console.error("[get-families] Error fetching families:", error)
        return []
    }

    if (!families || families.length === 0) {
        return []
    }

    return families.map((family: any) => {
        const base: FamilyUnitWithRelations = {
            id: family.id,
            name: family.name,
            description: family.description,
            profile_picture_url: family.profile_picture_url,
            banner_image_url: family.banner_image_url,
            primary_contact_id: family.primary_contact_id,
            photos: family.photos,
            hero_photo: family.hero_photo,
            tenant_id: family.tenant_id,
            created_at: family.created_at,
            updated_at: family.updated_at,
        }

        if (enrichWithMembers && family.members) {
            base.members = family.members
        }

        if (enrichWithPets && family.pets) {
            base.pets = family.pets
        }

        return base
    })
})

export async function getFamilyById(
    familyId: string,
    options: GetFamiliesOptions = {},
): Promise<FamilyUnitWithRelations | null> {
    const supabase = await createServerClient()

    const { data: family } = await supabase.from("family_units").select("tenant_id").eq("id", familyId).single()

    if (!family) {
        return null
    }

    const families = await getFamilies(family.tenant_id, {
        ...options,
    })

    return families.find((f) => f.id === familyId) || null
}
