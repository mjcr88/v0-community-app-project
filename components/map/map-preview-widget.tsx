"use client"

import { GoogleMapViewer } from "@/components/map/google-map-viewer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
  mapZoom = 12,
}: MapPreviewWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <h3 className="text-lg font-semibold">Community Map</h3>
          <p className="text-sm text-muted-foreground">Explore locations in your community</p>
        </div>
        <Button asChild size="sm" className="shadow-lg">
          <Link href={`/t/${tenantSlug}/dashboard/map`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Map
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 rounded-lg overflow-hidden border bg-muted">
          <GoogleMapViewer
            locations={locations}
            tenantId={tenantId}
            mapCenter={mapCenter}
            mapZoom={mapZoom}
            isAdmin={false}
            highlightLocationId={highlightLocationId}
            minimal={true}
          />
        </div>
      </CardContent>
    </Card>
  )
}
