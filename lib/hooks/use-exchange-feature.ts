"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

/**
 * Hook to check if exchange feature is enabled for a tenant
 */
export function useExchangeFeature(tenantId: string) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchExchangeFeature = async () => {
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("tenants")
        .select("exchange_enabled")
        .eq("id", tenantId)
        .single()

      if (data) {
        setIsEnabled(data.exchange_enabled ?? false)
      }
      setIsLoading(false)
    }

    fetchExchangeFeature()
  }, [tenantId])

  return { isEnabled, isLoading }
}
