"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from 'lucide-react'
import { MapboxFullViewer } from "@/components/map/MapboxViewer"
import useSWR from "swr"

interface MapSectionLazyProps {
  tenantSlug: string
  tenantId: string
  lotLocationId?: string
  mapCenter: { lat: number; lng: number } | null
  checkIns: any[]
  neighborhoodName?: string
  lotNumber?: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function MapSectionLazy({
  tenantSlug,
  tenantId,
  lotLocationId,
  mapCenter,
  checkIns,
  neighborhoodName,
  lotNumber,
}: MapSectionLazyProps) {
  // Always fetch locations
  const { data: locations, error, isLoading } = useSWR(
    `/api/locations/${tenantId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  return (
    <div className="md:col-span-2 lg:col-span-2 lg:row-span-6 h-full flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow">
      <div className="flex flex-row items-center justify-between p-6 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold leading-none tracking-tight">Community Map</h3>
        </div>
        <a
          href={`/t/${tenantSlug}/dashboard/community-map`}
          className="text-sm text-primary hover:underline font-medium"
        >
          View full map
        </a>
      </div>
      <div className="p-0 flex-1 relative min-h-[400px]" style={{ touchAction: 'none' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-sm text-destructive">Failed to load map</p>
          </div>
        )}

        {locations && (
          <MapboxFullViewer
            tenantSlug={tenantSlug}
            tenantId={tenantId}
            locations={locations}
            mapCenter={mapCenter}
            highlightLocationId={lotLocationId}
            checkIns={checkIns}
            showControls={false}
            className="h-full w-full"
          />
        )}
      </div>
    </div>
  )
}
