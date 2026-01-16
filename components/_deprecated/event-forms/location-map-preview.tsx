"use client"

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"

interface Location {
  id: string
  name: string
  type: string
  coordinates: { lat: number; lng: number } | null
  icon: string | null
  facility_type: string | null
}

interface LocationMapPreviewProps {
  location: Location
  tenantId: string
}

export function LocationMapPreview({ location }: LocationMapPreviewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID

  if (!apiKey) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          Map preview unavailable (API key missing)
        </CardContent>
      </Card>
    )
  }

  if (!location.coordinates) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          <MapPin className="h-6 w-6 mx-auto mb-2 opacity-50" />
          No coordinates available for this location
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="h-48 w-full rounded-md overflow-hidden">
          <APIProvider apiKey={apiKey}>
            <Map
              center={location.coordinates}
              zoom={16}
              mapTypeId="satellite"
              gestureHandling="none"
              disableDefaultUI={true}
              zoomControl={false}
              {...(mapId ? { mapId } : {})}
            >
              <Marker position={location.coordinates} title={location.name} />
            </Map>
          </APIProvider>
        </div>
        <div className="p-3 border-t">
          <div className="flex items-center gap-2">
            {location.icon && <span className="text-lg">{location.icon}</span>}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{location.name}</p>
              {location.facility_type && <p className="text-xs text-muted-foreground">{location.facility_type}</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
