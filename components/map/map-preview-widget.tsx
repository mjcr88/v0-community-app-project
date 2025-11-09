"use client"

import { GoogleMapViewer } from "@/components/map/google-map-viewer"

interface MapPreviewWidgetProps {
  tenantSlug: string
  locations: any[]
  mapCenter: { lat: number; lng: number } | null
  highlightLocationId: string
}

export function MapPreviewWidget({ tenantSlug, locations, mapCenter, highlightLocationId }: MapPreviewWidgetProps) {
  console.log("[v0] MapPreviewWidget rendering:", {
    tenantSlug,
    locationsCount: locations.length,
    mapCenter,
    highlightLocationId,
  })

  return (
    <div className="h-48 rounded-lg overflow-hidden border bg-muted">
      <GoogleMapViewer
        tenantSlug={tenantSlug}
        initialLocations={locations}
        mapCenter={mapCenter}
        mapZoom={17}
        isAdmin={false}
        highlightLocationId={highlightLocationId}
        minimal={true}
      />
    </div>
  )
}
