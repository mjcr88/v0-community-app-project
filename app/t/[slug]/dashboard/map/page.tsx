"use client"

import { useState, useEffect } from "react"
import { GoogleMapViewer } from "@/components/map/google-map-viewer"
import { createBrowserClient } from "@/lib/supabase/client"
import { useParams, useSearchParams } from "next/navigation"

export default function ResidentMapPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const highlightLot = searchParams.get("highlightLot")

  const [highlightedLocationId, setHighlightedLocationId] = useState<string | null>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [mapZoom, setMapZoom] = useState(15)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMapData = async () => {
      const supabase = createBrowserClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: resident } = await supabase
        .from("users")
        .select("*, tenant_id")
        .eq("id", user.id)
        .eq("role", "resident")
        .single()

      if (!resident) return

      const { data: tenant } = await supabase.from("tenants").select("*").eq("id", resident.tenant_id).single()

      if (!tenant) return

      const { data: locationData } = await supabase.from("locations").select("*").eq("tenant_id", tenant.id)

      setLocations(locationData || [])
      setMapCenter(
        tenant.map_center_coordinates
          ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
          : null,
      )
      setMapZoom(tenant.map_default_zoom || 15)

      if (highlightLot) {
        const lotLocation = locationData?.find((loc: any) => loc.lot_id === highlightLot && loc.type === "lot")
        if (lotLocation) {
          setHighlightedLocationId(lotLocation.id)
        }
      }

      setLoading(false)
    }

    loadMapData()
  }, [highlightLot])

  const handleLocationClick = (locationId: string | null) => {
    setHighlightedLocationId(locationId)
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <GoogleMapViewer
        tenantSlug={slug}
        initialLocations={locations}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        isAdmin={false}
        highlightedLocationId={highlightedLocationId || undefined}
        onLocationClick={handleLocationClick}
      />
    </div>
  )
}
