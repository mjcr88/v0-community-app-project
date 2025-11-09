"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

type TenantFeatures = {
  neighborhoods?: boolean
  interests?: boolean
  skills?: boolean
  pets?: boolean
  families?: boolean
  lots?: boolean
  journey_stages?: boolean
  onboarding?: boolean
  map?: boolean
  location_types?: {
    facility?: boolean
    lot?: boolean
    walking_path?: boolean
    neighborhood?: boolean
    boundary?: boolean
    protection_zone?: boolean
    easement?: boolean
    playground?: boolean
    public_street?: boolean
    green_area?: boolean
    recreational_zone?: boolean
  }
}

export function useTenantFeatures(tenantId: string) {
  const [features, setFeatures] = useState<TenantFeatures>({
    neighborhoods: true,
    interests: true,
    skills: true,
    pets: true,
    families: true,
    lots: true,
    journey_stages: true,
    onboarding: true,
    map: true,
    location_types: {
      facility: true,
      lot: true,
      walking_path: true,
      neighborhood: true,
      boundary: true,
      protection_zone: true,
      easement: true,
      playground: true,
      public_street: true,
      green_area: true,
      recreational_zone: true,
    },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeatures = async () => {
      const supabase = createBrowserClient()
      const { data } = await supabase.from("tenants").select("features").eq("id", tenantId).single()

      if (data?.features) {
        setFeatures(data.features)
      }
      setLoading(false)
    }

    fetchFeatures()
  }, [tenantId])

  const hasFeature = (feature: keyof TenantFeatures) => {
    return features[feature] ?? true
  }

  return { features, hasFeature, loading }
}
