
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function useFamilyByLot(tenantId: string, lotId: string | undefined | null) {
    const [data, setData] = useState<{
        residents: any[]
        family: any | null
        isLoading: boolean
        error: string | null
    }>({
        residents: [],
        family: null,
        isLoading: false,
        error: null,
    })

    useEffect(() => {
        async function fetchFamily() {
            if (!lotId || !tenantId) {
                setData(prev => ({ ...prev, residents: [], family: null, isLoading: false }))
                return
            }

            setData(prev => ({ ...prev, isLoading: true, error: null }))
            const supabase = createClient()

            try {
                // 1. Get residents in the lot
                const { data: residents, error: residentsError } = await supabase
                    .from("users")
                    .select("id, first_name, last_name, family_unit_id, role, email") // Added email for context
                    .eq("tenant_id", tenantId)
                    .eq("lot_id", lotId)

                if (residentsError) throw residentsError

                // 2. Identify Family Unit
                // We assume residents in a lot usually belong to the same family or are independent.
                // We look for the first non-null family_unit_id.
                const familyUnitId = residents?.find(r => r.family_unit_id)?.family_unit_id

                let family = null
                if (familyUnitId) {
                    const { data: familyData, error: familyError } = await supabase
                        .from("family_units")
                        .select("*")
                        .eq("id", familyUnitId)
                        .single()

                    if (familyError) throw familyError
                    family = familyData
                }

                setData({
                    residents: residents || [],
                    family,
                    isLoading: false,
                    error: null
                })

            } catch (err: any) {
                console.error("Error fetching family by lot:", err)
                setData(prev => ({
                    ...prev,
                    residents: [],
                    family: null,
                    isLoading: false,
                    error: err.message || "Failed to fetch family info"
                }))
            }
        }

        fetchFamily()
    }, [tenantId, lotId])

    return data
}
