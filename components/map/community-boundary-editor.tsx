"use client"

import { useState, useCallback, useEffect } from "react"
import { APIProvider, Map, useMap, Marker } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Trash2, Save, Info, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

interface CommunityBoundaryEditorProps {
  tenantId: string
  initialBoundary?: { lat: number; lng: number }[] | null
  mapCenter?: { lat: number; lng: number }
  mapZoom?: number
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

export function CommunityBoundaryEditor({
  tenantId,
  initialBoundary,
  mapCenter: initialMapCenter,
  mapZoom: initialMapZoom,
  onSave,
}: CommunityBoundaryEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [boundary, setBoundary] = useState<{ lat: number; lng: number }[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [center, setCenter] = useState(initialMapCenter || { lat: 9.9567, lng: -84.5333 })
  const [zoom, setZoom] = useState(initialMapZoom || 15)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

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
      console.log("[v0] Point added:", { lat, lng, totalPoints: boundary.length + 1 })
      toast({
        description: `Point ${boundary.length + 1} added`,
      })
    },
    [isDrawing, boundary.length, toast],
  )

  const startDrawing = () => {
    setIsDrawing(true)
    setBoundary([])
    toast({
      title: "Drawing Mode Active",
      description: "Click on the map to draw the community boundary polygon",
    })
  }

  const editExisting = () => {
    if (initialBoundary && initialBoundary.length > 0) {
      setBoundary([...initialBoundary])
      setIsDrawing(true)
      toast({
        title: "Edit Mode Active",
        description: "Click to add more points or save to update the boundary",
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
      console.log("[v0] Saving boundary:", { tenantId, pointCount: boundary.length, boundary })

      const response = await fetch(`/api/tenants/${tenantId}/boundary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boundary }),
      })

      console.log("[v0] Save response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Save failed:", errorData)
        throw new Error(errorData.error || "Failed to save boundary")
      }

      const result = await response.json()
      console.log("[v0] Save successful:", result)

      toast({
        title: "Boundary Saved",
        description: "Community boundary has been saved successfully",
      })

      onSave?.(boundary)
      setIsDrawing(false)

      console.log("[v0] Refreshing page to reload boundary data")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving boundary:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save community boundary",
        variant: "destructive",
      })
    }
  }

  const hasExistingBoundary = initialBoundary && initialBoundary.length >= 3
  const canSave = boundary.length >= 3

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">How to create a community boundary:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Start Drawing" to begin</li>
              <li>Click on the map to place points around your community perimeter</li>
              <li>The polygon will automatically close between your points</li>
              <li>Click "Save Boundary" when finished (minimum 3 points required)</li>
            </ol>
            {hasExistingBoundary && (
              <p className="text-sm text-muted-foreground mt-2">
                You have an existing boundary. Use "Edit Existing" to modify it or "Redraw" to start fresh.
              </p>
            )}
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        {!isDrawing ? (
          <>
            <Button onClick={startDrawing} className="gap-2">
              <MapPin className="h-4 w-4" />
              {hasExistingBoundary ? "Redraw Boundary" : "Start Drawing"}
            </Button>
            {hasExistingBoundary && (
              <Button onClick={editExisting} variant="outline" className="gap-2 bg-transparent">
                <Edit className="h-4 w-4" />
                Edit Existing
              </Button>
            )}
          </>
        ) : (
          <>
            <Button onClick={saveBoundary} disabled={!canSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Boundary ({boundary.length} points)
            </Button>
            <Button onClick={clearBoundary} variant="outline" className="gap-2 bg-transparent">
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </>
        )}
      </div>

      <Card className="h-[600px]">
        <CardContent className="p-1.5 h-full">
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
                style={{ width: "100%", height: "100%" }}
              >
                <MapClickHandler isDrawing={isDrawing} onMapClick={handleMapClick} />

                {boundary.length > 0 && boundary.length < 3 && (
                  <>
                    {boundary.map((point, index) => (
                      <Marker key={`boundary-marker-${index}`} position={point} />
                    ))}
                  </>
                )}

                {boundary.length === 2 && (
                  <Polyline
                    path={boundary}
                    strokeColor="#FF6B35"
                    strokeOpacity={0.8}
                    strokeWeight={3}
                    clickable={false}
                  />
                )}

                {boundary.length >= 3 && (
                  <Polygon
                    key={`boundary-polygon-${boundary.length}`}
                    paths={boundary}
                    strokeColor="#FF6B35"
                    strokeOpacity={0.8}
                    strokeWeight={3}
                    fillColor="#FF6B35"
                    fillOpacity={0.2}
                    clickable={false}
                  />
                )}

                {!isDrawing && hasExistingBoundary && (
                  <Polygon
                    key="existing-boundary"
                    paths={initialBoundary}
                    strokeColor="#10b981"
                    strokeOpacity={0.8}
                    strokeWeight={3}
                    fillColor="#10b981"
                    fillOpacity={0.2}
                    clickable={false}
                  />
                )}
              </Map>
            </APIProvider>

            <div className="absolute left-3 top-3 flex flex-col gap-2">
              <Button variant="secondary" size="icon" onClick={() => setZoom(zoom + 1)} className="h-10 w-10 shadow-lg">
                +
              </Button>
              <Button variant="secondary" size="icon" onClick={() => setZoom(zoom - 1)} className="h-10 w-10 shadow-lg">
                −
              </Button>
            </div>

            {isDrawing && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border">
                <p className="text-sm font-medium">
                  {boundary.length === 0
                    ? "Click on the map to start drawing"
                    : boundary.length < 3
                      ? `${boundary.length} point${boundary.length === 1 ? "" : "s"} placed (need ${3 - boundary.length} more)`
                      : `${boundary.length} points placed - Ready to save!`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
