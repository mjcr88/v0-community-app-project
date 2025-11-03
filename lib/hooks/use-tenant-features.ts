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
