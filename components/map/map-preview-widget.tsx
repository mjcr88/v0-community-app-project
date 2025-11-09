"use client"

import { GoogleMapViewer } from "./google-map-viewer"

interface MapPreviewWidgetProps {
  tenantId: string
  locations: any[]
  mapCenter?: { lat: number; lng: number }
  mapZoom?: number
  highlightLocationId?: string
  minimal?: boolean
}

export function MapPreviewWidget({
  tenantId,
  locations,
  mapCenter,
  mapZoom = 17,
  highlightLocationId,
  minimal = true,
}: MapPreviewWidgetProps) {
  return (
    <div className="h-[600px] w-full overflow-hidden rounded-lg border">
      <GoogleMapViewer
        locations={locations}
        tenantId={tenantId}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        highlightLocationId={highlightLocationId}
        minimal={minimal}
      />
    </div>
  )
}
