"use client"

import { GoogleMapViewer } from "@/components/map/google-map-viewer"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Maximize2 } from "lucide-react"

interface MapPreviewWidgetProps {
  tenantSlug: string
  tenantId: string
  locations: any[]
  mapCenter: { lat: number; lng: number } | null
  highlightLocationId?: string
}

export function MapPreviewWidget({
  tenantSlug,
  tenantId,
  locations,
  mapCenter,
  highlightLocationId,
}: MapPreviewWidgetProps) {
  console.log("[v0] MapPreviewWidget rendering:", {
    tenantSlug,
    tenantId,
    locationsCount: locations.length,
    mapCenter,
    highlightLocationId,
  })

  return (
    <Card className="relative group">
      <CardContent className="p-0">
        <div className="h-48 rounded-lg overflow-hidden border bg-muted relative">
          <GoogleMapViewer
            locations={locations}
            tenantId={tenantId}
            mapCenter={mapCenter}
            mapZoom={15}
            isAdmin={false}
            highlightLocationId={highlightLocationId}
            minimal={true}
          />

          <Link href={`/t/${tenantSlug}/dashboard/map`}>
            <button className="absolute bottom-4 right-4 p-2 bg-white/90 hover:bg-white shadow-lg rounded-md transition-all opacity-0 group-hover:opacity-100 z-10">
              <Maximize2 className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
