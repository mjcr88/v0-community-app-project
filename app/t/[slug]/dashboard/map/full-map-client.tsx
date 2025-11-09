"use client"

import { GoogleMapViewer } from "@/components/map/google-map-viewer"

interface FullMapClientProps {
  locations: any[]
  tenantId: string
  mapCenter: { lat: number; lng: number }
  highlightLocationId?: string
}

export function FullMapClient({ locations, tenantId, mapCenter, highlightLocationId }: FullMapClientProps) {
  return (
    <div className="h-screen w-full">
      <GoogleMapViewer
        locations={locations}
        tenantId={tenantId}
        mapCenter={mapCenter}
        mapZoom={15}
        highlightLocationId={highlightLocationId}
        minimal={false}
      />
    </div>
  )
}
