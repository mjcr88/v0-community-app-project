"use client"

import { MapPin, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
// Lazy load map component
const GoogleMapViewer = dynamic(
  () => import("@/components/map/google-map-viewer").then((mod) => mod.GoogleMapViewer),
  {
    loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
    ssr: false,
  }
)
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

interface EventLocationSectionProps {
  locationType: string | null
  locationId: string | null
  customLocationName: string | null
  customLocationCoordinates: any | null
  customLocationType: string | null
  location?: {
    id: string
    name: string
    type: string
    coordinates?: any
    boundary_coordinates?: any
    path_coordinates?: any
  } | null
  tenantSlug: string
  tenantId: string
}

export function EventLocationSection({
  locationType,
  locationId,
  customLocationName,
  customLocationCoordinates,
  customLocationType,
  location,
  tenantSlug,
  tenantId,
}: EventLocationSectionProps) {
  const [allLocations, setAllLocations] = useState<any[]>([])
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const loadLocations = async () => {
      const supabase = createBrowserClient()
      const { data: locations } = await supabase
        .from("locations")
        .select("id, name, type, coordinates, boundary_coordinates, path_coordinates")
        .eq("tenant_id", tenantId)

      if (locations) {
        setAllLocations(locations)
      }

      if (locationType === "community_location" && location) {
        if (location.coordinates) {
          setMapCenter(location.coordinates)
        } else if (location.boundary_coordinates && location.boundary_coordinates.length > 0) {
          const lats = location.boundary_coordinates.map((c: any) => c[0])
          const lngs = location.boundary_coordinates.map((c: any) => c[1])
          const centerLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length
          const centerLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length
          setMapCenter({ lat: centerLat, lng: centerLng })
        } else if (location.path_coordinates && location.path_coordinates.length > 0) {
          setMapCenter({ lat: location.path_coordinates[0][0], lng: location.path_coordinates[0][1] })
        }
      } else if (
        locationType === "custom_temporary" &&
        customLocationCoordinates?.lat &&
        customLocationCoordinates?.lng
      ) {
        setMapCenter({ lat: customLocationCoordinates.lat, lng: customLocationCoordinates.lng })
      }
    }

    loadLocations()
  }, [locationType, location, customLocationCoordinates, tenantId])

  const openInGoogleMaps = () => {
    if (customLocationCoordinates?.lat && customLocationCoordinates?.lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${customLocationCoordinates.lat},${customLocationCoordinates.lng}`
      window.open(url, "_blank")
    }
  }

  // No location set
  if (!locationType) {
    return null
  }

  // Community location
  if (locationType === "community_location" && location) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{location.name}</p>
            </div>
          </div>
          <Link href={`/t/${tenantSlug}/dashboard/locations/${location.id}`}>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <ExternalLink className="h-4 w-4" />
              View Details
            </Button>
          </Link>
        </div>

        <div className="h-[300px] rounded-lg overflow-hidden border">
          <GoogleMapViewer
            locations={allLocations}
            tenantId={tenantId}
            selectedLocationId={location.id}
            mapCenter={mapCenter}
            mapZoom={16}
            minimal={true}
            showInfoCard={false}
            enableClickablePlaces={true}
          />
        </div>
      </div>
    )
  }

  // Custom location
  if (locationType === "custom_temporary" && customLocationName) {
    const customCenter =
      customLocationCoordinates?.lat && customLocationCoordinates?.lng
        ? { lat: customLocationCoordinates.lat, lng: customLocationCoordinates.lng }
        : null

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Event Location</p>
              <p className="font-medium">{customLocationName}</p>
              <p className="text-xs text-muted-foreground">Custom event location</p>
            </div>
          </div>
          {customCenter && (
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={openInGoogleMaps}>
              <ExternalLink className="h-4 w-4" />
              Open in Maps
            </Button>
          )}
        </div>

        {customCenter && (
          <div className="h-[300px] rounded-lg overflow-hidden border">
            <GoogleMapViewer
              locations={allLocations}
              tenantId={tenantId}
              mapCenter={customCenter}
              mapZoom={15}
              minimal={true}
              showInfoCard={false}
              drawnCoordinates={customCenter}
              drawnType="marker"
              enableClickablePlaces={true}
            />
          </div>
        )}
      </div>
    )
  }

  return null
}
