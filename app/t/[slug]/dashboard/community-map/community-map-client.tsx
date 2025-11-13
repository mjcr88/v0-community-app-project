"use client"

import { LocationTypeCards } from "@/components/map/location-type-cards"
import { MapPreviewWidget } from "@/components/map/map-preview-widget"
import { ResidentLocationsTable } from "@/components/map/resident-locations-table"

interface CommunityMapClientProps {
  slug: string
  tenantId: string
  counts: {
    facilities: number
    lots: number
    neighborhoods: number
    walkingPaths: number
    protectionZones: number
    easements: number
    playgrounds: number
    publicStreets: number
    greenAreas: number
    recreationalZones: number
  }
  locations: any[]
  checkIns: any[]
  mapCenter: { lat: number; lng: number } | null
  boundaryLocationId?: string
  mapZoom?: number
  initialTypeFilter?: string
}

export function CommunityMapClient({
  slug,
  tenantId,
  counts,
  locations,
  checkIns,
  mapCenter,
  boundaryLocationId,
  mapZoom = 14,
  initialTypeFilter,
}: CommunityMapClientProps) {
  const handleCardClick = (type: string) => {
    // Scroll to locations table
    const tableElement = document.getElementById("locations-table")
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    // Trigger a custom event that the table can listen to
    window.dispatchEvent(new CustomEvent("filterLocations", { detail: { type } }))
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community Map</h1>
          <p className="text-muted-foreground">Explore locations and facilities in your community</p>
        </div>
      </div>

      <MapPreviewWidget
        tenantSlug={slug}
        tenantId={tenantId}
        locations={locations}
        checkIns={checkIns}
        mapCenter={mapCenter}
        highlightLocationId={boundaryLocationId}
        mapZoom={mapZoom}
      />

      <LocationTypeCards counts={counts} clickable={true} onCardClick={handleCardClick} />

      <ResidentLocationsTable locations={locations} tenantSlug={slug} initialTypeFilter={initialTypeFilter} />
    </div>
  )
}
