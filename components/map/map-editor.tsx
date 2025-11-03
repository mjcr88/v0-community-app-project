"use client"

import { useState } from "react"
import { Map, Marker, Overlay } from "pigeon-maps"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Locate, Layers, Undo, Save, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { createLocation } from "@/app/actions/locations"

interface MapEditorProps {
  tenantSlug: string
  tenantId: string
}

type DrawMode = "marker" | "polygon" | "polyline" | null
type TileLayer = "satellite" | "terrain" | "street"

function esriSatelliteProvider(x: number, y: number, z: number) {
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
}

function openTopoMapProvider(x: number, y: number, z: number) {
  return `https://tile.opentopomap.org/${z}/${x}/${y}.png`
}

function openStreetMapProvider(x: number, y: number, z: number) {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
}

export function MapEditor({ tenantSlug, tenantId }: MapEditorProps) {
  const router = useRouter()
  const [center, setCenter] = useState<[number, number]>([9.7489, -84.0907])
  const [zoom, setZoom] = useState(15)
  const [tileLayer, setTileLayer] = useState<TileLayer>("satellite")
  const [drawMode, setDrawMode] = useState<DrawMode>(null)
  const [points, setPoints] = useState<Array<[number, number]>>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [locationType, setLocationType] = useState<"facility" | "lot" | "walking_path">("facility")
  const [facilityType, setFacilityType] = useState("")
  const [icon, setIcon] = useState("📍")
  const [isSaving, setIsSaving] = useState(false)

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude])
          setZoom(16)
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }

  const toggleTileLayer = () => {
    setTileLayer((prev) => {
      if (prev === "satellite") return "terrain"
      if (prev === "terrain") return "street"
      return "satellite"
    })
  }

  const getTileProvider = () => {
    if (tileLayer === "satellite") return esriSatelliteProvider
    if (tileLayer === "terrain") return openTopoMapProvider
    return openStreetMapProvider
  }

  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    if (drawMode === "marker") {
      setPoints([latLng])
      setDrawMode(null)
    } else if (drawMode === "polygon" || drawMode === "polyline") {
      setPoints([...points, latLng])
    }
  }

  const handleFinishDrawing = () => {
    if (drawMode === "polygon" && points.length >= 3) {
      setDrawMode(null)
    } else if (drawMode === "polyline" && points.length >= 2) {
      setDrawMode(null)
    }
  }

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints(points.slice(0, -1))
    }
  }

  const handleClear = () => {
    setPoints([])
    setDrawMode(null)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a name for the location")
      return
    }

    if (points.length === 0) {
      alert("Please draw a location on the map")
      return
    }

    setIsSaving(true)

    try {
      const locationData: any = {
        tenant_id: tenantId,
        name: name.trim(),
        description: description.trim() || null,
        type: locationType,
        icon: icon || null,
      }

      if (points.length === 1) {
        locationData.coordinates = { lat: points[0][0], lng: points[0][1] }
      } else if (locationType === "lot" || (locationType === "facility" && points.length > 1)) {
        locationData.boundary_coordinates = points
      } else if (locationType === "walking_path") {
        locationData.path_coordinates = points
      }

      if (locationType === "facility" && facilityType.trim()) {
        locationData.facility_type = facilityType.trim()
      }

      await createLocation(locationData)

      router.push(`/t/${tenantSlug}/admin/map`)
      router.refresh()
    } catch (error) {
      console.error("Error saving location:", error)
      alert("Failed to save location. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const latLngToPixel = (lat: number, lng: number, mapZoom: number): [number, number] => {
    const scale = 256 * Math.pow(2, mapZoom)
    const worldX = ((lng + 180) / 360) * scale
    const worldY =
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * scale
    return [worldX, worldY]
  }

  const getPolygonCenter = (coordinates: Array<[number, number]>): [number, number] => {
    const sum = coordinates.reduce(
      (acc, coord) => {
        return [acc[0] + coord[0], acc[1] + coord[1]]
      },
      [0, 0],
    )
    return [sum[0] / coordinates.length, sum[1] / coordinates.length]
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-0">
            <div className="relative w-full h-[600px]">
              <Map
                provider={getTileProvider()}
                center={center}
                zoom={zoom}
                onBoundsChanged={({ center: newCenter, zoom: newZoom }) => {
                  setCenter(newCenter)
                  setZoom(newZoom)
                }}
                onClick={handleMapClick}
                height={600}
              >
                {points.length > 0 && points.length === 1 && <Marker anchor={points[0]} color="#22c55e" />}

                {points.length > 1 && (
                  <Overlay anchor={getPolygonCenter(points)}>
                    <svg
                      style={{
                        position: "absolute",
                        pointerEvents: "none",
                        width: "100%",
                        height: "100%",
                        left: -latLngToPixel(getPolygonCenter(points)[0], getPolygonCenter(points)[1], zoom)[0],
                        top: -latLngToPixel(getPolygonCenter(points)[0], getPolygonCenter(points)[1], zoom)[1],
                      }}
                    >
                      {drawMode === "polygon" || (drawMode === null && points.length >= 3) ? (
                        <polygon
                          points={points
                            .map((coord) => {
                              const [x, y] = latLngToPixel(coord[0], coord[1], zoom)
                              return `${x},${y}`
                            })
                            .join(" ")}
                          fill="rgba(34, 197, 94, 0.2)"
                          stroke="#22c55e"
                          strokeWidth="2"
                        />
                      ) : (
                        <polyline
                          points={points
                            .map((coord) => {
                              const [x, y] = latLngToPixel(coord[0], coord[1], zoom)
                              return `${x},${y}`
                            })
                            .join(" ")}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="3"
                        />
                      )}
                      {points.map((point, index) => {
                        const [x, y] = latLngToPixel(point[0], point[1], zoom)
                        return <circle key={index} cx={x} cy={y} r="5" fill="white" stroke="#22c55e" strokeWidth="2" />
                      })}
                    </svg>
                  </Overlay>
                )}
              </Map>

              <Button
                onClick={toggleTileLayer}
                size="icon"
                variant="secondary"
                className="absolute top-4 right-16 z-[1000] shadow-lg"
                title={`Current: ${tileLayer}. Click to switch.`}
              >
                <Layers className="h-4 w-4" />
              </Button>

              <Button onClick={handleLocate} size="icon" className="absolute top-4 right-4 z-[1000] shadow-lg">
                <Locate className="h-4 w-4" />
              </Button>

              {drawMode && (
                <div className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-lg shadow-lg">
                  <p className="text-sm font-medium mb-2">
                    {drawMode === "marker" && "Click on the map to place a marker"}
                    {drawMode === "polygon" && "Click to add points. Click Finish when done (min 3 points)"}
                    {drawMode === "polyline" && "Click to add points. Click Finish when done (min 2 points)"}
                  </p>
                  <div className="flex gap-2">
                    {(drawMode === "polygon" || drawMode === "polyline") && (
                      <>
                        <Button size="sm" variant="outline" onClick={handleUndo} disabled={points.length === 0}>
                          <Undo className="h-3 w-3 mr-1" />
                          Undo
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleFinishDrawing}
                          disabled={
                            (drawMode === "polygon" && points.length < 3) ||
                            (drawMode === "polyline" && points.length < 2)
                          }
                        >
                          Finish
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="destructive" onClick={handleClear}>
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Location Type</Label>
              <Select value={locationType} onValueChange={(value: any) => setLocationType(value)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facility">Facility</SelectItem>
                  <SelectItem value="lot">Lot Boundary</SelectItem>
                  <SelectItem value="walking_path">Walking Path</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Draw Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={drawMode === "marker" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDrawMode("marker")
                    setPoints([])
                  }}
                >
                  Marker
                </Button>
                <Button
                  variant={drawMode === "polygon" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDrawMode("polygon")
                    setPoints([])
                  }}
                >
                  Polygon
                </Button>
                <Button
                  variant={drawMode === "polyline" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDrawMode("polyline")
                    setPoints([])
                  }}
                >
                  Path
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Location name" />
            </div>

            {locationType === "facility" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="facilityType">Facility Type</Label>
                  <Input
                    id="facilityType"
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value)}
                    placeholder="e.g., Pool, Gym, Park"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Input
                    id="icon"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="Emoji icon"
                    maxLength={2}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving || points.length === 0 || !name.trim()}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Location"}
              </Button>
              <Button variant="outline" onClick={() => router.push(`/t/${tenantSlug}/admin/map`)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
