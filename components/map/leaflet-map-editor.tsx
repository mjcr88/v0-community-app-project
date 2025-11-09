"use client"

import { useState, useRef, useCallback } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import { FeatureGroup } from "react-leaflet"
import { EditControl } from "react-leaflet-draw"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-draw/dist/leaflet.draw.css"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Satellite, MapIcon, Navigation } from "lucide-react"

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

const TILE_LAYERS = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri",
  },
  terrain: {
    url: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap",
  },
  street: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  },
}

interface LeafletMapEditorProps {
  tenantSlug: string
  onSave: (data: {
    name: string
    type: string
    description: string
    facilityType?: string
    coordinates?: { lat: number; lng: number }
    boundaryCoordinates?: Array<{ lat: number; lng: number }>
    pathCoordinates?: Array<{ lat: number; lng: number }>
  }) => Promise<void>
}

function TileLayerSwitcher({ layer }: { layer: string }) {
  const map = useMap()

  return (
    <TileLayer key={layer} url={TILE_LAYERS[layer].url} attribution={TILE_LAYERS[layer].attribution} maxZoom={19} />
  )
}

export function LeafletMapEditor({ tenantSlug, onSave }: LeafletMapEditorProps) {
  const [tileLayer, setTileLayer] = useState<string>("satellite")
  const [drawingMode, setDrawingMode] = useState<"marker" | "polygon" | "polyline" | null>(null)
  const [drawnFeature, setDrawnFeature] = useState<any>(null)

  // Form state
  const [name, setName] = useState("")
  const [type, setType] = useState<string>("facility")
  const [description, setDescription] = useState("")
  const [facilityType, setFacilityType] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const mapRef = useRef<L.Map>(null)

  const handleCreated = useCallback((e: any) => {
    const { layerType, layer } = e
    console.log("[v0] Feature created:", layerType, layer)

    if (layerType === "marker") {
      const { lat, lng } = layer.getLatLng()
      setDrawnFeature({ type: "marker", coordinates: { lat, lng } })
    } else if (layerType === "polygon") {
      const latlngs = layer.getLatLngs()[0].map((ll: L.LatLng) => ({ lat: ll.lat, lng: ll.lng }))
      setDrawnFeature({ type: "polygon", coordinates: latlngs })
    } else if (layerType === "polyline") {
      const latlngs = layer.getLatLngs().map((ll: L.LatLng) => ({ lat: ll.lat, lng: ll.lng }))
      setDrawnFeature({ type: "polyline", coordinates: latlngs })
    }
  }, [])

  const handleEdited = useCallback((e: any) => {
    const layers = e.layers
    layers.eachLayer((layer: any) => {
      console.log("[v0] Feature edited:", layer)
      // Update the drawn feature with edited coordinates
      if (layer instanceof L.Marker) {
        const { lat, lng } = layer.getLatLng()
        setDrawnFeature({ type: "marker", coordinates: { lat, lng } })
      } else if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0].map((ll: L.LatLng) => ({ lat: ll.lat, lng: ll.lng }))
        setDrawnFeature({ type: "polygon", coordinates: latlngs })
      } else if (layer instanceof L.Polyline) {
        const latlngs = layer.getLatLngs().map((ll: L.LatLng) => ({ lat: ll.lat, lng: ll.lng }))
        setDrawnFeature({ type: "polyline", coordinates: latlngs })
      }
    })
  }, [])

  const handleDeleted = useCallback(() => {
    console.log("[v0] Feature deleted")
    setDrawnFeature(null)
  }, [])

  const handleSave = async () => {
    if (!name || !drawnFeature) {
      alert("Please enter a name and draw a feature on the map")
      return
    }

    setIsSaving(true)
    try {
      const data: any = {
        name,
        type,
        description,
      }

      if (type === "facility") {
        data.facilityType = facilityType
      }

      if (drawnFeature.type === "marker") {
        data.coordinates = drawnFeature.coordinates
      } else if (drawnFeature.type === "polygon") {
        data.boundaryCoordinates = drawnFeature.coordinates
      } else if (drawnFeature.type === "polyline") {
        data.pathCoordinates = drawnFeature.coordinates
      }

      await onSave(data)

      // Reset form
      setName("")
      setDescription("")
      setFacilityType("")
      setDrawnFeature(null)
    } catch (error) {
      console.error("[v0] Error saving location:", error)
      alert("Error saving location: " + (error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 relative">
        <MapContainer center={[9.9312, -84.0739]} zoom={15} className="h-full w-full" ref={mapRef}>
          <TileLayerSwitcher layer={tileLayer} />

          <FeatureGroup>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onEdited={handleEdited}
              onDeleted={handleDeleted}
              draw={{
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: true,
                polygon: true,
                polyline: true,
              }}
            />
          </FeatureGroup>
        </MapContainer>

        {/* Tile Layer Switcher */}
        <div className="absolute top-4 left-4 z-[1000] flex gap-2">
          <Button
            variant={tileLayer === "satellite" ? "default" : "outline"}
            size="icon"
            onClick={() => setTileLayer("satellite")}
            title="Satellite View"
          >
            <Satellite className="h-4 w-4" />
          </Button>
          <Button
            variant={tileLayer === "terrain" ? "default" : "outline"}
            size="icon"
            onClick={() => setTileLayer("terrain")}
            title="Terrain View"
          >
            <Navigation className="h-4 w-4" />
          </Button>
          <Button
            variant={tileLayer === "street" ? "default" : "outline"}
            size="icon"
            onClick={() => setTileLayer("street")}
            title="Street View"
          >
            <MapIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Form Panel */}
      <Card className="p-6 space-y-4 border-t">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Location name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facility">Facility</SelectItem>
                <SelectItem value="lot">Lot</SelectItem>
                <SelectItem value="path">Walking Path</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "facility" && (
            <div className="space-y-2">
              <Label htmlFor="facilityType">Facility Type</Label>
              <Input
                id="facilityType"
                value={facilityType}
                onChange={(e) => setFacilityType(e.target.value)}
                placeholder="e.g., Pool, Gym, Park"
              />
            </div>
          )}

          <div className="space-y-2 col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {drawnFeature ? (
              <span className="text-green-600">
                ✓ {drawnFeature.type === "marker" ? "Marker" : drawnFeature.type === "polygon" ? "Polygon" : "Path"}{" "}
                drawn
              </span>
            ) : (
              <span>Use the drawing tools on the map to add a feature</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !name || !drawnFeature}>
              {isSaving ? "Saving..." : "Save Location"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
