"use client"

import { useState, useCallback, useEffect } from "react"
import { GoogleMap, useJsApiLoader, Polygon } from "@react-google-maps/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Trash2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { google } from "google-maps"

interface CommunityBoundaryEditorProps {
  tenantId: string
  initialBoundary?: { lat: number; lng: number }[]
  onSave?: (boundary: { lat: number; lng: number }[]) => void
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
}

const defaultCenter = {
  lat: 40.7128,
  lng: -74.006,
}

export function CommunityBoundaryEditor({ tenantId, initialBoundary, onSave }: CommunityBoundaryEditorProps) {
  const { toast } = useToast()
  const [boundary, setBoundary] = useState<google.maps.LatLng[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [center, setCenter] = useState(defaultCenter)

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  // Load initial boundary
  useEffect(() => {
    if (initialBoundary && initialBoundary.length > 0) {
      const bounds = initialBoundary.map((coord) => new google.maps.LatLng(coord.lat, coord.lng))
      setBoundary(bounds)

      // Center map on boundary
      const avgLat = initialBoundary.reduce((sum, c) => sum + c.lat, 0) / initialBoundary.length
      const avgLng = initialBoundary.reduce((sum, c) => sum + c.lng, 0) / initialBoundary.length
      setCenter({ lat: avgLat, lng: avgLng })
    }
  }, [initialBoundary])

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!isDrawing || !e.latLng) return

      setBoundary((prev) => [...prev, e.latLng!])
    },
    [isDrawing],
  )

  const toggleDrawing = () => {
    setIsDrawing(!isDrawing)
    if (!isDrawing) {
      toast({
        title: "Drawing Mode Active",
        description: "Click on the map to draw the community boundary",
      })
    }
  }

  const clearBoundary = () => {
    setBoundary([])
    setIsDrawing(false)
    toast({
      title: "Boundary Cleared",
      description: "The community boundary has been cleared",
    })
  }

  const saveBoundary = async () => {
    if (boundary.length < 3) {
      toast({
        title: "Invalid Boundary",
        description: "Please draw at least 3 points to create a boundary",
        variant: "destructive",
      })
      return
    }

    const boundaryCoords = boundary.map((point) => ({
      lat: point.lat(),
      lng: point.lng(),
    }))

    try {
      const response = await fetch(`/api/tenants/${tenantId}/boundary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boundary: boundaryCoords }),
      })

      if (!response.ok) throw new Error("Failed to save boundary")

      toast({
        title: "Boundary Saved",
        description: "Community boundary has been saved successfully",
      })

      onSave?.(boundaryCoords)
      setIsDrawing(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save community boundary",
        variant: "destructive",
      })
    }
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full">Loading map...</div>
  }

  return (
    <Card className="flex flex-col min-h-[600px]">
      <CardContent className="p-1.5 flex-1">
        <div className="relative h-full w-full overflow-hidden rounded-lg">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={15}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={handleMapClick}
            options={{
              mapTypeId: "satellite",
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: true,
              streetViewControl: false,
              fullscreenControl: true,
            }}
          >
            {boundary.length > 0 && (
              <Polygon
                paths={boundary}
                options={{
                  fillColor: "#FF6B35",
                  fillOpacity: 0.1,
                  strokeColor: "#FF6B35",
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                  strokeDashArray: [10, 5],
                }}
              />
            )}
          </GoogleMap>

          {/* Drawing Controls */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <Button
              onClick={toggleDrawing}
              variant={isDrawing ? "default" : "secondary"}
              size="icon"
              className="shadow-lg"
            >
              <MapPin className="h-4 w-4" />
            </Button>
            <Button
              onClick={clearBoundary}
              variant="secondary"
              size="icon"
              className="shadow-lg"
              disabled={boundary.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Save Button */}
          <div className="absolute bottom-4 right-4">
            <Button onClick={saveBoundary} className="shadow-lg" disabled={boundary.length < 3}>
              <Save className="h-4 w-4 mr-2" />
              Save Boundary
            </Button>
          </div>

          {/* Instructions */}
          {isDrawing && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border">
              <p className="text-sm font-medium">Click on the map to draw the community boundary</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
