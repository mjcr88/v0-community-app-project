"use client"

import { LocationTypeCards } from "@/components/map/location-type-cards"
import { MapPreviewWidget } from "@/components/map/map-preview-widget"
import { ResidentLocationsTable } from "@/components/map/resident-locations-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Map } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  mapCenter: { lat: number; lng: number } | null
  initialTypeFilter?: string
}

export function CommunityMapClient({
  slug,
  tenantId,
  counts,
  locations,
  mapCenter,
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
        <Button asChild>
          <Link href={`/t/${slug}/dashboard/map`}>
            <Map className="h-4 w-4 mr-2" />
            Full Screen Map
          </Link>
        </Button>
      </div>

      <LocationTypeCards counts={counts} clickable={true} onCardClick={handleCardClick} />

      <Card>
        <CardHeader>
          <CardTitle>Interactive Map Preview</CardTitle>
          <CardDescription>
            Click any location to view details, or open full screen map for better navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MapPreviewWidget tenantSlug={slug} tenantId={tenantId} locations={locations} mapCenter={mapCenter} />
        </CardContent>
      </Card>

      <ResidentLocationsTable locations={locations} tenantSlug={slug} initialTypeFilter={initialTypeFilter} />
    </div>
  )
}
