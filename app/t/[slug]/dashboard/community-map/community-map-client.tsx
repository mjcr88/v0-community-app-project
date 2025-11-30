"use client"

import { MapboxFullViewer } from "@/components/map/MapboxViewer"

interface CommunityMapClientProps {
  slug: string
  tenantId: string
  counts: any
  locations: any[]
  checkIns?: any[]
  mapCenter: { lat: number; lng: number } | null
  boundaryLocationId?: string
  mapZoom?: number
  initialTypeFilter?: string
}

export function CommunityMapClient({
  slug,
  tenantId,
  locations,
  checkIns = [],
  mapCenter,
  mapZoom = 14,
}: CommunityMapClientProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-100px)] w-full gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Community Map</h1>
        <p className="text-muted-foreground">
          Explore your community, find neighbors, and discover local amenities.
        </p>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden border shadow-sm">
        <MapboxFullViewer
          locations={locations}
          checkIns={checkIns}
          tenantId={tenantId}
          tenantSlug={slug}
          mapCenter={mapCenter}
          mapZoom={mapZoom}
          showControls={true}
          className="h-full w-full"
        />
      </div>
    </div>
  )
}
