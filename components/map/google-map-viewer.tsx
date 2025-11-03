"use client"

import { useRef, useState } from "react"
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Locate, Layers, Plus } from "lucide-react"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { google } from "googlemaps"

interface Location {
  id: string
  name: string
  coordinates: { lat: number; lng: number }
  type: "marker" | "polygon" | "polyline"
  paths?: Array<{ lat: number; lng: number }>
}

interface GoogleMapViewerProps {
  center?: { lat: number; lng: number }
  zoom?: number
  locations?: Location[]
  showAddButton?: boolean
  onAddLocation?: () => void
}

export function GoogleMapViewer({
  center = { lat: 9.9281, lng: -84.0907 },
  zoom = 13,
  locations = [],
  showAddButton = false,
  onAddLocation,
}: GoogleMapViewerProps) {
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "hybrid" | "terrain">("roadmap")
  const mapRef = useRef<google.maps.Map | null>(null)

  const handleZoomIn = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || zoom
      mapRef.current.setZoom(currentZoom + 1)
    }
  }

  const handleZoomOut = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || zoom
      mapRef.current.setZoom(currentZoom - 1)
    }
  }

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          mapRef.current?.panTo(pos)
          mapRef.current?.setZoom(15)
        },
        () => {
          console.error("Error: The Geolocation service failed.")
        },
      )
    }
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
      <div className="relative h-full w-full">
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapTypeId={mapType}
          disableDefaultUI={true}
          onLoad={(map) => {
            mapRef.current = map
          }}
          className="h-full w-full"
        >
          {/* Render locations */}
          {locations.map((location) => {
            if (location.type === "marker") {
              return <Marker key={location.id} position={location.coordinates} title={location.name} />
            } else if (location.type === "polygon" && location.paths) {
              return <Polygon key={location.id} paths={location.paths} />
            } else if (location.type === "polyline" && location.paths) {
              return <Polyline key={location.id} path={location.paths} />
            }
            return null
          })}
        </Map>

        {/* Zoom Controls - Top Left */}
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
          <Button size="icon" variant="secondary" onClick={handleZoomIn} className="h-10 w-10 shadow-lg">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleZoomOut} className="h-10 w-10 shadow-lg">
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Add Location Button - Bottom Left (if admin) */}
        {showAddButton && onAddLocation && (
          <div className="absolute bottom-4 left-4 z-10">
            <Button size="icon" variant="secondary" onClick={onAddLocation} className="h-10 w-10 shadow-lg">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Layer Selection - Top Right */}
        <div className="absolute right-4 top-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="secondary" className="h-10 w-10 shadow-lg">
                <Layers className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMapType("roadmap")}>Roadmap</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMapType("satellite")}>Satellite</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMapType("hybrid")}>Hybrid</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMapType("terrain")}>Terrain</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Locate Me - Bottom Right */}
        <div className="absolute bottom-4 right-4 z-10">
          <Button size="icon" variant="secondary" onClick={handleLocateMe} className="h-10 w-10 shadow-lg">
            <Locate className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </APIProvider>
  )
}
