"use client"

import { GoogleMapViewer } from "@/components/map/google-map-viewer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface FullMapClientProps {
  locations: any[]
  tenantId: string
  mapCenter: { lat: number; lng: number } | null
  tenantSlug: string
  highlightLocationId?: string
}

export function FullMapClient({ locations, tenantId, mapCenter, tenantSlug, highlightLocationId }: FullMapClientProps) {
  return (
    <div className="h-screen w-full flex flex-col">
      <div className="p-4 border-b bg-background flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/t/${tenantSlug}/dashboard/community-map`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Full Community Map</h1>
          <p className="text-sm text-muted-foreground">Click on locations to view details</p>
        </div>
      </div>
      <div className="flex-1">
        <GoogleMapViewer
          locations={locations}
          tenantId={tenantId}
          mapCenter={mapCenter}
          mapZoom={15}
          highlightLocationId={highlightLocationId}
          minimal={false}
        />
      </div>
    </div>
  )
}
