"use client"

import { GoogleMapViewer } from "@/components/map/google-map-viewer"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MapPreviewWidgetProps {
  tenantSlug: string
  tenantId: string
  locations: any[]
  mapCenter: { lat: number; lng: number } | null
  highlightLocationId?: string
  mapZoom?: number
}

export function MapPreviewWidget({
  tenantSlug,
  tenantId,
  locations,
  mapCenter,
  highlightLocationId,
  mapZoom = 14,
}: MapPreviewWidgetProps) {
  return (
    <Card className="relative">
      <CardContent className="p-0">
        <div className="h-96 rounded-lg overflow-hidden border bg-muted relative">
          <GoogleMapViewer
            locations={locations}
            tenantId={tenantId}
            mapCenter={mapCenter}
            mapZoom={mapZoom}
            isAdmin={false}
            highlightLocationId={highlightLocationId}
            minimal={true}
          />

          <div className="absolute bottom-4 right-4 z-10">
            <Button asChild size="sm" className="shadow-lg">
              <Link href={`/t/${tenantSlug}/dashboard/map`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Map
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
