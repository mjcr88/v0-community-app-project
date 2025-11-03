"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { MapPin, Pentagon, Minus, Undo2, Trash2, Check, ZoomIn, ZoomOut, Locate, Layers } from "lucide-react"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type DrawingMode = "marker" | "polygon" | "polyline" | null

interface GoogleMapEditorProps {
  center?: { lat: number; lng: number }
  zoom?: number
  onSave?: (data: {
    markers: Array<{ lat: number; lng: number }>
    polygons: Array<Array<{ lat: number; lng: number }>>
    polylines: Array<Array<{ lat: number; lng: number }>>
  }) => void
}

export function GoogleMapEditor({ center = { lat: 9.9281, lng: -84.0907 }, zoom = 13, onSave }: GoogleMapEditorProps) {
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null)
  const [markers, setMarkers] = useState<Array<{ lat: number; lng: number }>>([])
  const [polygonPoints, setPolygonPoints] = useState<Array<{ lat: number; lng: number }>>([])
  const [polylinePoints, setPolylinePoints] = useState<Array<{ lat: number; lng: number }>>([])
  const [completedPolygons, setCompletedPolygons] = useState<Array<Array<{ lat: number; lng: number }>>>([])
  const [completedPolylines, setCompletedPolylines] = useState<Array<Array<{ lat: number; lng: number }>>>([])
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "hybrid" | "terrain">("roadmap")
  const mapRef = useRef<google.maps.Map | null>(null)

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return

      const lat = e.latLng.lat()
      const lng = e.latLng.lng()

      console.log("[v0] Map clicked:", { lat, lng, drawingMode })

      if (drawingMode === "marker") {
        setMarkers((prev) => [...prev, { lat, lng }])
        setDrawingMode(null)
      } else if (drawingMode === "polygon") {
        setPolygonPoints((prev) => [...prev, { lat, lng }])
      } else if (drawingMode === "polyline") {
        setPolylinePoints((prev) => [...prev, { lat, lng }])
      }
    },
    [drawingMode],
  )

  const handleFinishDrawing = () => {
    if (drawingMode === "polygon" && polygonPoints.length >= 3) {
      setCompletedPolygons((prev) => [...prev, polygonPoints])
      setPolygonPoints([])
      setDrawingMode(null)
    } else if (drawingMode === "polyline" && polylinePoints.length >= 2) {
      setCompletedPolylines((prev) => [...prev, polylinePoints])
      setPolylinePoints([])
      setDrawingMode(null)
    }
  }

  const handleUndo = () => {
    if (drawingMode === "polygon" && polygonPoints.length > 0) {
      setPolygonPoints((prev) => prev.slice(0, -1))
    } else if (drawingMode === "polyline" && polylinePoints.length > 0) {
      setPolylinePoints((prev) => prev.slice(0, -1))
    } else if (markers.length > 0) {
      setMarkers((prev) => prev.slice(0, -1))
    } else if (completedPolylines.length > 0) {
      setCompletedPolylines((prev) => prev.slice(0, -1))
    } else if (completedPolygons.length > 0) {
      setCompletedPolygons((prev) => prev.slice(0, -1))
    }
  }

  const handleClear = () => {
    setMarkers([])
    setPolygonPoints([])
    setPolylinePoints([])
    setCompletedPolygons([])
    setCompletedPolylines([])
    setDrawingMode(null)
  }

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

  useEffect(() => {
    if (onSave) {
      onSave({
        markers,
        polygons: completedPolygons,
        polylines: completedPolylines,
      })
    }
  }, [markers, completedPolygons, completedPolylines, onSave])

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
      <div className="relative h-full w-full">
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapTypeId={mapType}
          disableDefaultUI={true}
          onClick={handleMapClick}
          onLoad={(map) => {
            mapRef.current = map
          }}
          className="h-full w-full"
        >
          {/* Render markers */}
          {markers.map((marker, index) => (
            <Marker key={`marker-${index}`} position={marker} />
          ))}

          {/* Render completed polygons */}
          {completedPolygons.map((polygon, index) => (
            <Polygon key={`completed-polygon-${index}`} paths={polygon} clickable={false} />
          ))}

          {/* Render current polygon being drawn */}
          {polygonPoints.length > 0 && (
            <>
              {polygonPoints.map((point, index) => (
                <Marker key={`polygon-point-${index}`} position={point} />
              ))}
              {polygonPoints.length >= 3 && <Polygon paths={polygonPoints} clickable={false} />}
            </>
          )}

          {/* Render completed polylines */}
          {completedPolylines.map((polyline, index) => (
            <Polyline key={`completed-polyline-${index}`} path={polyline} clickable={false} />
          ))}

          {/* Render current polyline being drawn */}
          {polylinePoints.length > 0 && (
            <>
              {polylinePoints.map((point, index) => (
                <Marker key={`polyline-point-${index}`} position={point} />
              ))}
              {polylinePoints.length >= 2 && <Polyline path={polylinePoints} clickable={false} />}
            </>
          )}
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

        {/* Drawing Tools - Bottom Left */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          <Button
            size="icon"
            variant={drawingMode === "marker" ? "default" : "secondary"}
            onClick={() => setDrawingMode(drawingMode === "marker" ? null : "marker")}
            className="h-10 w-10 shadow-lg"
          >
            <MapPin className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={drawingMode === "polygon" ? "default" : "secondary"}
            onClick={() => setDrawingMode(drawingMode === "polygon" ? null : "polygon")}
            className="h-10 w-10 shadow-lg"
          >
            <Pentagon className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={drawingMode === "polyline" ? "default" : "secondary"}
            onClick={() => setDrawingMode(drawingMode === "polyline" ? null : "polyline")}
            className="h-10 w-10 shadow-lg"
          >
            <Minus className="h-4 w-4" />
          </Button>
          {(drawingMode === "polygon" || drawingMode === "polyline") && (
            <Button
              size="icon"
              variant="default"
              onClick={handleFinishDrawing}
              className="h-10 w-10 bg-green-600 shadow-lg hover:bg-green-700"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="secondary" onClick={handleUndo} className="h-10 w-10 shadow-lg">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleClear} className="h-10 w-10 shadow-lg">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

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
