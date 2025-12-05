"use client"

import { MapboxFullViewer } from "@/components/map/MapboxViewer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { ExternalLink } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface MapPreviewWidgetProps {
  tenantSlug: string
  tenantId: string
  locations: any[]
  mapCenter: { lat: number; lng: number } | null
  highlightLocationId?: string
  mapZoom?: number
  checkIns?: any[]
  hideHeader?: boolean
  hideSidebar?: boolean
  disableAutoScroll?: boolean
}

export function MapPreviewWidget({
  tenantSlug,
  tenantId,
  locations,
  mapCenter,
  highlightLocationId,
  mapZoom = 12,
  checkIns = [],
  hideHeader = false,
  hideSidebar = false,
  disableAutoScroll = false,
}: MapPreviewWidgetProps) {
  const content = (
    <div className="h-[400px] rounded-lg overflow-hidden border bg-muted">
      <MapboxFullViewer
        locations={locations}
        tenantId={tenantId}
        tenantSlug={tenantSlug}
        checkIns={checkIns}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        highlightLocationId={highlightLocationId}
        showControls={false}
        disableAutoScroll={true}
        hideSidebar={true}
      />
    </div>
  )

  if (hideHeader) {
    return content
  }

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
            Map
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {content}
      </CardContent>
    </Card>
  )
}
