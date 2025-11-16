"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, MapPin } from 'lucide-react'
import { MapPreviewWidget } from "@/components/map/map-preview-widget"
import useSWR from "swr"

interface MapSectionLazyProps {
  tenantSlug: string
  tenantId: string
  lotLocationId?: string
  mapCenter: { lat: number; lng: number } | null
  checkIns: any[]
  neighborhoodName?: string
  lotNumber?: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function MapSectionLazy({
  tenantSlug,
  tenantId,
  lotLocationId,
  mapCenter,
  checkIns,
  neighborhoodName,
  lotNumber,
}: MapSectionLazyProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Only fetch locations when section is opened
  const { data: locations, error, isLoading } = useSWR(
    isOpen ? `/api/locations/${tenantId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="md:col-span-2 lg:col-span-2 lg:row-span-6">
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Your Neighborhood</CardTitle>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "transform rotate-180" : ""}`}
            />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-2 pt-2">
            <div>
              <div className="text-2xl font-bold">{neighborhoodName || "Not assigned"}</div>
              <p className="text-xs text-muted-foreground">Lot #{lotNumber || "N/A"}</p>
            </div>
            
            {isLoading && (
              <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            )}
            
            {error && (
              <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                <p className="text-sm text-destructive">Failed to load map</p>
              </div>
            )}
            
            {locations && (
              <>
                <MapPreviewWidget
                  tenantSlug={tenantSlug}
                  tenantId={tenantId}
                  locations={locations}
                  mapCenter={mapCenter}
                  highlightLocationId={lotLocationId}
                  checkIns={checkIns}
                />
                <p className="text-xs text-center text-muted-foreground">
                  Interact with map or click expand button to view full map
                </p>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
