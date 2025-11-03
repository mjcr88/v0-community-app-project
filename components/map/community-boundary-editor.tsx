"use client"

import { useState, useCallback, useEffect } from "react"
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Trash2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Polygon } from "./polygon"

interface CommunityBoundaryEditorProps {
  tenantId: string
  initialBoundary?: { lat: number; lng: number }[]
  onSave?: (boundary: { lat: number; lng: number }[]) => void
}

function MapClickHandler({
  isDrawing,
  onMapClick,
}: {
  isDrawing: boolean
  onMapClick: (lat: number, lng: number) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!map || !isDrawing) return

    const clickListener = map.addListener("click", (e: any) => {
      if (e.latLng) {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        onMapClick(lat, lng)
      }
    })

    return () => {
      if (clickListener) {
        clickListener.remove()
      }
    }
  }, [map, isDrawing, onMapClick])

  return null
}

export function CommunityBoundaryEditor({ tenantId, initialBoundary, onSave }: CommunityBoundaryEditorProps) {
  const { toast } = useToast()
  const [boundary, setBoundary] = useState<{ lat: number; lng: number }[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.006 })
  const [zoom, setZoom] = useState(15)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  // Load initial boundary
  useEffect(() => {
    if (initialBoundary && initialBoundary.length > 0) {
      setBoundary(initialBoundary)

      // Center map on boundary
      const avgLat = initialBoundary.reduce((sum, c) => sum + c.lat, 0) / initialBoundary.length
      const avgLng = initialBoundary.reduce((sum, c) => sum + c.lng, 0) / initialBoundary.length
      setCenter({ lat: avgLat, lng: avgLng })
    }
  }, [initialBoundary])

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!isDrawing) return
      setBoundary((prev) => [...prev, { lat, lng }])
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

    try {
      const response = await fetch(`/api/tenants/${tenantId}/boundary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boundary }),
      })

      if (!response.ok) throw new Error("Failed to save boundary")

      toast({
        title: "Boundary Saved",
        description: "Community boundary has been saved successfully",
      })

      onSave?.(boundary)
      setIsDrawing(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save community boundary",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="flex flex-col min-h-[600px]">
      <CardContent className="p-1.5 flex-1">
        <div className="relative h-full w-full overflow-hidden rounded-lg">
          <APIProvider apiKey={apiKey}>
            <Map
              center={center}
              zoom={zoom}
              mapTypeId="satellite"
              gestureHandling="greedy"
              disableDefaultUI={true}
              clickableIcons={false}
              onCenterChanged={(e) => setCenter(e.detail.center)}
              onZoomChanged={(e) => setZoom(e.detail.zoom)}
            >
              <MapClickHandler isDrawing={isDrawing} onMapClick={handleMapClick} />

              {boundary.length > 0 && (
                <Polygon
                  paths={boundary}
                  strokeColor="#FF6B35"
                  strokeOpacity={0.8}
                  strokeWeight={3}
                  fillColor="#FF6B35"
                  fillOpacity={0.1}
                  clickable={false}
                />
              )}
            </Map>
          </APIProvider>

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
