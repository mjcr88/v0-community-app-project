"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createLocation, updateLocation, deleteLocation } from "@/app/actions/locations"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Loader2,
  MapPin,
  Pentagon,
  Route,
  Locate,
  AlertCircle,
  Trash2,
  Undo,
  Layers,
  Check,
  Filter,
  Upload,
  X,
  ImageIcon,
  Plus,
} from "lucide-react"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import { geolocate } from "@/lib/geolocate"
import { Badge } from "@/components/ui/badge"

type DrawingMode = "marker" | "polygon" | "polyline" | null
type LatLng = { lat: number; lng: number }

interface GoogleMapEditorProps {
  tenantSlug: string
  tenantId: string
  communityBoundary?: Array<[number, number]> | null
  lots?: Array<{ id: string; lot_number: string; address: string | null; neighborhoods: { name: string } | null }>
  neighborhoods?: Array<{ id: string; name: string }>
}

function MapClickHandler({
  drawingMode,
  onMapClick,
}: {
  drawingMode: DrawingMode
  onMapClick: (lat: number, lng: number) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

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
  }, [map, drawingMode, onMapClick])

  return null
}

export function GoogleMapEditor({
  tenantSlug,
  tenantId,
  communityBoundary,
  lots = [],
  neighborhoods = [],
}: GoogleMapEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const preselectedNeighborhoodId = searchParams.get("neighborhoodId")
  const preselectedLotId = searchParams.get("lotId")
  const prefilledName = searchParams.get("name")
  const prefilledDescription = searchParams.get("description")

  const isEditingLot = !!preselectedLotId
  const isEditingNeighborhood = !!preselectedNeighborhoodId

  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null)
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">("satellite")
  const [saving, setSaving] = useState(false)
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 9.9567, lng: -84.5333 })
  const [mapZoom, setMapZoom] = useState(15)

  const [markerPosition, setMarkerPosition] = useState<LatLng | null>(null)
  const [polygonPoints, setPolygonPoints] = useState<LatLng[]>([])
  const [polylinePoints, setPolylinePoints] = useState<LatLng[]>([])
  const [savedLocations, setSavedLocations] = useState<any[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [locationType, setLocationType] = useState<"facility" | "lot" | "walking_path" | "neighborhood">("facility")
  const [facilityType, setFacilityType] = useState("")
  const [icon, setIcon] = useState("")
  const [selectedLotId, setSelectedLotId] = useState<string>("")
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>("")

  const [showFacilities, setShowFacilities] = useState(true)
  const [showLots, setShowLots] = useState(true)
  const [showWalkingPaths, setShowWalkingPaths] = useState(true)
  const [showNeighborhoods, setShowNeighborhoods] = useState(true)

  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  useEffect(() => {
    const loadLocations = async () => {
      const supabase = createBrowserClient()
      const { data } = await supabase.from("locations").select("*").eq("tenant_id", tenantId)
      if (data) {
        setSavedLocations(data)
      }
    }
    loadLocations()
  }, [tenantId])

  useEffect(() => {
    if (preselectedNeighborhoodId) {
      setSelectedNeighborhoodId(preselectedNeighborhoodId)
      setLocationType("neighborhood")

      if (prefilledName) {
        setName(prefilledName)
      } else {
        const selectedNeighborhood = neighborhoods.find((n) => n.id === preselectedNeighborhoodId)
        if (selectedNeighborhood) {
          setName(selectedNeighborhood.name)
        }
      }

      if (prefilledDescription) {
        setDescription(prefilledDescription)
      }

      if (prefilledName) {
        toast({
          title: "Draw Neighborhood Boundary",
          description: `Click the polygon tool and draw the boundary for "${prefilledName}"`,
          duration: 5000,
        })
      }
    }
    if (preselectedLotId) {
      setSelectedLotId(preselectedLotId)
      setLocationType("lot")
      const selectedLot = lots.find((lot) => lot.id === preselectedLotId)
      if (selectedLot) {
        setName(selectedLot.lot_number)
      }
    }
  }, [preselectedNeighborhoodId, preselectedLotId, prefilledName, prefilledDescription, lots, neighborhoods, toast])

  useEffect(() => {
    if (locationType === "lot" && selectedLotId) {
      const selectedLot = lots.find((lot) => lot.id === selectedLotId)
      if (selectedLot) {
        setName(selectedLot.lot_number)
      }
    }
    if (locationType === "neighborhood" && selectedNeighborhoodId) {
      const selectedNeighborhood = neighborhoods.find((n) => n.id === selectedNeighborhoodId)
      if (selectedNeighborhood) {
        setName(selectedNeighborhood.name)
      }
    }
  }, [locationType, selectedLotId, selectedNeighborhoodId, lots, neighborhoods])

  useEffect(() => {
    if (isEditingLot) {
      setShowFacilities(false)
      setShowWalkingPaths(false)
      setShowNeighborhoods(false)
      setShowLots(true)
    } else if (isEditingNeighborhood) {
      setShowFacilities(false)
      setShowWalkingPaths(false)
      setShowLots(false)
      setShowNeighborhoods(true)
    }
  }, [isEditingLot, isEditingNeighborhood])

  const handleLocationClick = (location: any) => {
    if (isEditingLot && location.type !== "lot") {
      toast({
        title: "Wrong Object Type",
        description: "You're editing a lot. Please select a lot object (blue polygon) on the map.",
        variant: "destructive",
      })
      return
    }

    if (isEditingNeighborhood && location.type !== "neighborhood") {
      toast({
        title: "Wrong Object Type",
        description: "You're editing a neighborhood. Please select a neighborhood object (purple polygon) on the map.",
        variant: "destructive",
      })
      return
    }

    setEditingLocationId(location.id)
    setName(location.name || "")
    setDescription(location.description || "")
    setLocationType(location.type)
    setFacilityType(location.facility_type || "")
    setIcon(location.icon || "")
    setSelectedLotId(location.lot_id || "")
    setSelectedNeighborhoodId(location.neighborhood_id || "")
    setUploadedPhotos(location.photos || [])

    if (location.coordinates) {
      setMarkerPosition(location.coordinates)
    }
    if (location.boundary_coordinates) {
      setPolygonPoints(
        location.boundary_coordinates.map((coord: [number, number]) => ({ lat: coord[0], lng: coord[1] })),
      )
    }
    if (location.path_coordinates) {
      setPolylinePoints(location.path_coordinates.map((coord: [number, number]) => ({ lat: coord[0], lng: coord[1] })))
    }

    toast({
      description: `Editing: ${location.name}`,
    })
  }

  const handleMapClick = (lat: number, lng: number) => {
    if (!drawingMode) {
      if (editingLocationId) {
        handleCancelEdit()
      }
      return
    }

    if (drawingMode === "marker") {
      setMarkerPosition({ lat, lng })
      setDrawingMode(null)
    } else if (drawingMode === "polygon") {
      const newPoints = [...polygonPoints, { lat, lng }]
      setPolygonPoints(newPoints)
    } else if (drawingMode === "polyline") {
      const newPoints = [...polylinePoints, { lat, lng }]
      setPolylinePoints(newPoints)
    }
  }

  const finishDrawing = () => {
    if (drawingMode === "polygon" && polygonPoints.length < 3) {
      toast({
        title: "Validation Error",
        description: "A polygon needs at least 3 points",
        variant: "destructive",
      })
      return
    }
    if (drawingMode === "polyline" && polylinePoints.length < 2) {
      toast({
        title: "Validation Error",
        description: "A line needs at least 2 points",
        variant: "destructive",
      })
      return
    }
    setDrawingMode(null)
  }

  const clearDrawing = () => {
    setMarkerPosition(null)
    setPolygonPoints([])
    setPolylinePoints([])
    setDrawingMode(null)
    toast({
      description: "All drawings cleared",
    })
  }

  const undoLastPoint = () => {
    if (drawingMode === "polygon" && polygonPoints.length > 0) {
      setPolygonPoints(polygonPoints.slice(0, -1))
    } else if (drawingMode === "polyline" && polylinePoints.length > 0) {
      setPolylinePoints(polylinePoints.slice(0, -1))
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingPhoto(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Upload failed")
        }

        const data = await response.json()
        return data.url
      })

      const urls = await Promise.all(uploadPromises)
      setUploadedPhotos([...uploadedPhotos, ...urls])

      toast({
        description: `${urls.length} photo${urls.length > 1 ? "s" : ""} uploaded successfully`,
      })
    } catch (error) {
      console.error("[v0] Photo upload error:", error)
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload photos",
        variant: "destructive",
      })
    } finally {
      setUploadingPhoto(false)
      e.target.value = ""
    }
  }

  const removePhoto = (urlToRemove: string) => {
    setUploadedPhotos(uploadedPhotos.filter((url) => url !== urlToRemove))
    toast({
      description: "Photo removed",
    })
  }

  const handleSave = async () => {
    if (locationType !== "lot" && locationType !== "neighborhood" && !name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a location name",
        variant: "destructive",
      })
      return
    }

    if (locationType === "facility" && !markerPosition && polygonPoints.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please place a marker or draw a boundary for the facility",
        variant: "destructive",
      })
      return
    }
    if (locationType === "lot" && polygonPoints.length < 3) {
      toast({
        title: "Validation Error",
        description: "Please draw a boundary for the lot (at least 3 points)",
        variant: "destructive",
      })
      return
    }
    if (locationType === "lot" && !selectedLotId) {
      toast({
        title: "Validation Error",
        description: "Please select a lot from the dropdown",
        variant: "destructive",
      })
      return
    }
    if (locationType === "neighborhood" && polygonPoints.length < 3) {
      toast({
        title: "Validation Error",
        description: "Please draw a boundary for the neighborhood (at least 3 points)",
        variant: "destructive",
      })
      return
    }
    if (locationType === "neighborhood" && !selectedNeighborhoodId) {
      toast({
        title: "Validation Error",
        description: "Please select a neighborhood from the dropdown",
        variant: "destructive",
      })
      return
    }
    if (locationType === "walking_path" && polylinePoints.length < 2) {
      toast({
        title: "Validation Error",
        description: "Please draw a path (at least 2 points)",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const locationData: any = {
        tenant_id: tenantId,
        name: name.trim(),
        type: locationType,
        description: description.trim() || null,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : null,
      }

      if (locationType === "facility") {
        if (markerPosition) {
          locationData.coordinates = markerPosition
        }
        if (polygonPoints.length > 0) {
          locationData.boundary_coordinates = polygonPoints.map((p) => [p.lat, p.lng])
        }
        if (facilityType) locationData.facility_type = facilityType
        if (icon) locationData.icon = icon
        if (selectedNeighborhoodId && selectedNeighborhoodId !== "none") {
          locationData.neighborhood_id = selectedNeighborhoodId
        }
      } else if (locationType === "lot") {
        locationData.boundary_coordinates = polygonPoints.map((p) => [p.lat, p.lng])
        locationData.lot_id = selectedLotId
      } else if (locationType === "neighborhood") {
        locationData.boundary_coordinates = polygonPoints.map((p) => [p.lat, p.lng])
        locationData.neighborhood_id = selectedNeighborhoodId
      } else if (locationType === "walking_path") {
        locationData.path_coordinates = polylinePoints.map((p) => [p.lat, p.lng])
        if (selectedNeighborhoodId && selectedNeighborhoodId !== "none") {
          locationData.neighborhood_id = selectedNeighborhoodId
        }
      }

      console.log("[v0] Saving location:", locationData)

      if (editingLocationId) {
        await updateLocation(editingLocationId, locationData)
        toast({
          title: "Success",
          description: "Location updated successfully!",
        })
      } else {
        await createLocation(locationData)
        toast({
          title: "Success",
          description: "Location saved successfully!",
        })
      }

      const supabase = createBrowserClient()
      const { data } = await supabase.from("locations").select("*").eq("tenant_id", tenantId)

      if (data) {
        setSavedLocations(data)
      }

      setMarkerPosition(null)
      setPolygonPoints([])
      setPolylinePoints([])
      setName("")
      setDescription("")
      setFacilityType("")
      setIcon("")
      setSelectedLotId("")
      setSelectedNeighborhoodId("")
      setDrawingMode(null)
      setUploadedPhotos([])
      setEditingLocationId(null)

      if (locationType === "neighborhood" && prefilledName) {
        toast({
          description: "Redirecting to neighborhoods list...",
        })
        setTimeout(() => {
          router.push(`/t/${tenantSlug}/admin/neighborhoods`)
        }, 1000)
      } else {
        toast({
          description: "Form cleared. You can add another location.",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving location:", error)
      toast({
        title: "Error",
        description: "Error saving location: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingLocationId(null)
    setMarkerPosition(null)
    setPolygonPoints([])
    setPolylinePoints([])
    setName("")
    setDescription("")
    setFacilityType("")
    setIcon("")
    setSelectedLotId("")
    setSelectedNeighborhoodId("")
    setUploadedPhotos([])
    toast({
      description: "Edit cancelled",
    })
  }

  const handleDelete = async () => {
    if (!editingLocationId) return

    const confirmed = window.confirm("Are you sure you want to delete this location? This action cannot be undone.")
    if (!confirmed) return

    setDeleting(true)

    try {
      await deleteLocation(editingLocationId, tenantId)

      toast({
        title: "Success",
        description: "Location deleted successfully!",
      })

      const supabase = createBrowserClient()
      const { data } = await supabase.from("locations").select("*").eq("tenant_id", tenantId)

      if (data) {
        setSavedLocations(data)
      }

      handleNewLocation()
    } catch (error) {
      console.error("[v0] Error deleting location:", error)
      toast({
        title: "Error",
        description: "Error deleting location: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleNewLocation = () => {
    setEditingLocationId(null)
    setMarkerPosition(null)
    setPolygonPoints([])
    setPolylinePoints([])
    setName("")
    setDescription("")
    setFacilityType("")
    setIcon("")
    setSelectedLotId("")
    setSelectedNeighborhoodId("")
    setUploadedPhotos([])
    setDrawingMode(null)
    toast({
      description: "Ready to create new location",
    })
  }

  const locateUser = async () => {
    try {
      const { lat, lng } = await geolocate()
      setMapCenter({ lat, lng })
      setMapZoom(15)
    } catch (error) {
      console.error("Error locating user:", error)
      toast({
        title: "Error",
        description: "Error locating user: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      })
    }
  }

  if (!apiKey) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Configuration Error</AlertTitle>
        <AlertDescription>
          Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
        </AlertDescription>
      </Alert>
    )
  }

  const filteredLocations = savedLocations.filter((location) => {
    if (location.type === "facility") return showFacilities
    if (location.type === "lot") return showLots
    if (location.type === "walking_path") return showWalkingPaths
    if (location.type === "neighborhood") return showNeighborhoods
    return true
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <Card className="min-h-[600px]">
        <CardContent className="p-1.5 h-full">
          <div className="relative h-full w-full overflow-hidden rounded-lg">
            <APIProvider apiKey={apiKey}>
              <Map
                center={mapCenter}
                zoom={mapZoom}
                mapTypeId={mapType}
                gestureHandling="greedy"
                disableDefaultUI={true}
                clickableIcons={false}
                onCenterChanged={(e) => setMapCenter(e.detail.center)}
                onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
              >
                <MapClickHandler drawingMode={drawingMode} onMapClick={handleMapClick} />

                {communityBoundary && communityBoundary.length >= 3 && (
                  <Polygon
                    paths={communityBoundary.map((coord: [number, number]) => ({ lat: coord[0], lng: coord[1] }))}
                    strokeColor="#fbbf24"
                    strokeOpacity={0.5}
                    strokeWeight={0.5}
                    fillColor="#fef3c7"
                    fillOpacity={0.25}
                    clickable={false}
                  />
                )}

                {markerPosition && <Marker position={markerPosition} />}

                {polygonPoints.length === 1 && <Marker position={polygonPoints[0]} />}

                {polygonPoints.length === 2 && (
                  <>
                    <Marker position={polygonPoints[0]} />
                    <Marker position={polygonPoints[1]} />
                    <Polyline
                      path={polygonPoints}
                      strokeColor="#ef4444"
                      strokeOpacity={0.8}
                      strokeWeight={2}
                      clickable={false}
                    />
                  </>
                )}

                {polygonPoints.length >= 3 && (
                  <Polygon
                    key={`drawing-polygon-${polygonPoints.length}`}
                    paths={polygonPoints}
                    strokeColor="#ef4444"
                    strokeOpacity={0.8}
                    strokeWeight={2}
                    fillColor="#ef4444"
                    fillOpacity={0.2}
                    clickable={false}
                  />
                )}

                {polylinePoints.length === 1 && <Marker position={polylinePoints[0]} />}

                {polylinePoints.length >= 2 && (
                  <Polyline
                    key={`drawing-polyline-${polylinePoints.length}`}
                    path={polylinePoints}
                    strokeColor="#f59e0b"
                    strokeOpacity={0.8}
                    strokeWeight={3}
                    clickable={false}
                  />
                )}

                {filteredLocations.map((location) => {
                  const isEditing = editingLocationId === location.id
                  const isHovered = hoveredLocationId === location.id

                  if (location.type === "facility" && location.coordinates) {
                    return (
                      <Marker
                        key={`saved-${location.id}`}
                        position={location.coordinates}
                        onClick={() => handleLocationClick(location)}
                      />
                    )
                  }
                  if (
                    (location.type === "facility" || location.type === "neighborhood") &&
                    location.boundary_coordinates
                  ) {
                    const paths = location.boundary_coordinates.map((coord: [number, number]) => ({
                      lat: coord[0],
                      lng: coord[1],
                    }))
                    return (
                      <Polygon
                        key={`saved-${location.id}`}
                        paths={paths}
                        strokeColor={isEditing ? "#10b981" : location.type === "neighborhood" ? "#a855f7" : "#fb923c"}
                        strokeOpacity={isHovered ? 1 : 0.7}
                        strokeWeight={isEditing ? 3 : isHovered ? 3 : 2}
                        fillColor={isEditing ? "#6ee7b7" : location.type === "neighborhood" ? "#d8b4fe" : "#fdba74"}
                        fillOpacity={isHovered ? 0.4 : 0.25}
                        onClick={() => handleLocationClick(location)}
                        onMouseOver={() => setHoveredLocationId(location.id)}
                        onMouseOut={() => setHoveredLocationId(null)}
                      />
                    )
                  }
                  if (location.type === "lot" && location.boundary_coordinates) {
                    const paths = location.boundary_coordinates.map((coord: [number, number]) => ({
                      lat: coord[0],
                      lng: coord[1],
                    }))
                    return (
                      <Polygon
                        key={`saved-${location.id}`}
                        paths={paths}
                        strokeColor={isEditing ? "#10b981" : "#60a5fa"}
                        strokeOpacity={isHovered ? 1 : 0.7}
                        strokeWeight={isEditing ? 3 : isHovered ? 3 : 2}
                        fillColor={isEditing ? "#6ee7b7" : "#93c5fd"}
                        fillOpacity={isHovered ? 0.4 : 0.25}
                        onClick={() => handleLocationClick(location)}
                        onMouseOver={() => setHoveredLocationId(location.id)}
                        onMouseOut={() => setHoveredLocationId(null)}
                      />
                    )
                  }
                  if (location.type === "walking_path" && location.path_coordinates) {
                    const path = location.path_coordinates.map((coord: [number, number]) => ({
                      lat: coord[0],
                      lng: coord[1],
                    }))
                    return (
                      <Polyline
                        key={`saved-${location.id}`}
                        path={path}
                        strokeColor={isEditing ? "#10b981" : "#3b82f6"}
                        strokeOpacity={isHovered ? 1 : 0.8}
                        strokeWeight={isEditing ? 4 : isHovered ? 5 : 3}
                        onClick={() => handleLocationClick(location)}
                        onMouseOver={() => setHoveredLocationId(location.id)}
                        onMouseOut={() => setHoveredLocationId(null)}
                      />
                    )
                  }
                  return null
                })}
              </Map>
            </APIProvider>

            <div className="absolute left-3 top-3 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setMapZoom(mapZoom + 1)}
                className="h-10 w-10 shadow-lg"
                title="Zoom In"
              >
                +
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setMapZoom(mapZoom - 1)}
                className="h-10 w-10 shadow-lg"
                title="Zoom Out"
              >
                −
              </Button>
            </div>

            <div className="absolute left-3 bottom-3 flex flex-col gap-2">
              <Button
                variant="default"
                size="icon"
                onClick={handleNewLocation}
                className="h-10 w-10 shadow-lg bg-blue-600 hover:bg-blue-700"
                title="New Location"
              >
                <Plus className="h-5 w-5" />
              </Button>
              <div className="h-px bg-border" />
              <Button
                variant={drawingMode === "marker" ? "default" : "secondary"}
                size="icon"
                onClick={() => setDrawingMode(drawingMode === "marker" ? null : "marker")}
                className="h-10 w-10 shadow-lg"
                title="Place Marker"
              >
                <MapPin className="h-5 w-5" />
              </Button>
              <Button
                variant={drawingMode === "polygon" ? "default" : "secondary"}
                size="icon"
                onClick={() => setDrawingMode(drawingMode === "polygon" ? null : "polygon")}
                className="h-10 w-10 shadow-lg"
                title="Draw Polygon"
              >
                <Pentagon className="h-5 w-5" />
              </Button>
              <Button
                variant={drawingMode === "polyline" ? "default" : "secondary"}
                size="icon"
                onClick={() => setDrawingMode(drawingMode === "polyline" ? null : "polyline")}
                className="h-10 w-10 shadow-lg"
                title="Draw Path"
              >
                <Route className="h-5 w-5" />
              </Button>
              <div className="h-px bg-border" />
              {(drawingMode === "polygon" || drawingMode === "polyline") && (
                <Button
                  variant="default"
                  size="icon"
                  onClick={finishDrawing}
                  className="h-10 w-10 shadow-lg bg-green-600 hover:bg-green-700"
                  title="Finish Drawing"
                >
                  <Check className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="secondary"
                size="icon"
                onClick={undoLastPoint}
                disabled={
                  (drawingMode === "polygon" && polygonPoints.length === 0) ||
                  (drawingMode === "polyline" && polylinePoints.length === 0) ||
                  (!drawingMode && polygonPoints.length === 0 && polylinePoints.length === 0)
                }
                className="h-10 w-10 shadow-lg"
                title="Undo Last Point"
              >
                <Undo className="h-5 w-5" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={clearDrawing}
                className="h-10 w-10 shadow-lg"
                title="Clear All"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>

            <div className="absolute right-3 top-3 flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-10 w-10 shadow-lg" title="Filter Locations">
                    <Filter className="h-4 w-4 text-black" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Show on Map</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={showFacilities} onCheckedChange={setShowFacilities}>
                    Facilities
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showLots} onCheckedChange={setShowLots}>
                    Lots
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showWalkingPaths} onCheckedChange={setShowWalkingPaths}>
                    Walking Paths
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showNeighborhoods} onCheckedChange={setShowNeighborhoods}>
                    Neighborhoods
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-10 w-10 shadow-lg" title="Map Type">
                    <Layers className="h-4 w-4 text-black" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setMapType("satellite")}>Satellite</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMapType("terrain")}>Terrain</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMapType("roadmap")}>Street</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="absolute bottom-3 right-3">
              <Button
                variant="secondary"
                size="icon"
                onClick={locateUser}
                className="h-10 w-10 shadow-lg"
                title="Locate Me"
              >
                <Locate className="h-5 w-5" />
              </Button>
            </div>

            {!editingLocationId && !prefilledName && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg border">
                <p className="text-sm font-medium">Click any location on the map to edit it</p>
              </div>
            )}

            {editingLocationId && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg border">
                <p className="text-sm font-medium">Editing: {name || "Location"}</p>
              </div>
            )}

            {locationType === "neighborhood" && prefilledName && !editingLocationId && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg border">
                <p className="text-sm font-medium">Creating boundary for: {prefilledName}</p>
              </div>
            )}

            {(drawingMode === "polygon" || drawingMode === "polyline") && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border">
                <p className="text-sm font-medium">
                  {drawingMode === "polygon" && (
                    <>
                      {polygonPoints.length === 0
                        ? "Click on the map to start drawing"
                        : polygonPoints.length < 3
                          ? `${polygonPoints.length} point${polygonPoints.length === 1 ? "" : "s"} placed (need ${3 - polygonPoints.length} more)`
                          : `${polygonPoints.length} points placed - Ready to save!`}
                    </>
                  )}
                  {drawingMode === "polyline" && (
                    <>
                      {polylinePoints.length === 0
                        ? "Click on the map to start drawing"
                        : polylinePoints.length < 2
                          ? `${polylinePoints.length} point placed (need ${2 - polylinePoints.length} more)`
                          : `${polylinePoints.length} points placed - Ready to save!`}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          {editingLocationId && (
            <Badge className="w-full justify-center bg-green-600 text-white">Editing Existing Location</Badge>
          )}

          {isEditingLot && !editingLocationId && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Editing Lot</AlertTitle>
              <AlertDescription className="text-blue-700">
                Click on a <strong>blue lot polygon</strong> on the map to edit it. Other object types are filtered out.
              </AlertDescription>
            </Alert>
          )}

          {isEditingNeighborhood && !editingLocationId && (
            <Alert className="bg-purple-50 border-purple-200">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              <AlertTitle className="text-purple-900">Editing Neighborhood</AlertTitle>
              <AlertDescription className="text-purple-700">
                Click on a <strong>purple neighborhood polygon</strong> on the map to edit it. Other object types are
                filtered out.
              </AlertDescription>
            </Alert>
          )}

          {locationType === "neighborhood" && prefilledName && !editingLocationId && (
            <Alert className="bg-purple-50 border-purple-200">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              <AlertTitle className="text-purple-900">Creating Neighborhood Boundary</AlertTitle>
              <AlertDescription className="text-purple-700">
                You're adding a boundary for <strong>{prefilledName}</strong>
              </AlertDescription>
            </Alert>
          )}

          {locationType === "lot" && selectedLotId && !editingLocationId && !isEditingLot && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Linking to Lot</AlertTitle>
              <AlertDescription className="text-blue-700">
                This location will be linked to <strong>{lots.find((l) => l.id === selectedLotId)?.lot_number}</strong>
              </AlertDescription>
            </Alert>
          )}

          {locationType === "neighborhood" &&
            selectedNeighborhoodId &&
            !prefilledName &&
            !editingLocationId &&
            !isEditingNeighborhood && (
              <Alert className="bg-purple-50 border-purple-200">
                <AlertCircle className="h-4 w-4 text-purple-600" />
                <AlertTitle className="text-purple-900">Linking to Neighborhood</AlertTitle>
                <AlertDescription className="text-purple-700">
                  This location will be linked to{" "}
                  <strong>{neighborhoods.find((n) => n.id === selectedNeighborhoodId)?.name}</strong>
                </AlertDescription>
              </Alert>
            )}

          <div className="space-y-2">
            <Label htmlFor="type">Location Type</Label>
            <Select value={locationType} onValueChange={(v) => setLocationType(v as any)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facility">Facility</SelectItem>
                <SelectItem value="lot">Lot</SelectItem>
                <SelectItem value="neighborhood">Neighborhood</SelectItem>
                <SelectItem value="walking_path">Walking Path</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {locationType === "lot" && (
            <div className="space-y-2">
              <Label htmlFor="lot">Select Lot *</Label>
              <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                <SelectTrigger id="lot">
                  <SelectValue placeholder="Choose a lot..." />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.lot_number} {lot.neighborhoods?.name && `(${lot.neighborhoods.name})`}
                      {lot.address && ` - ${lot.address}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {locationType === "neighborhood" && (
            <div className="space-y-2">
              <Label htmlFor="neighborhood-select">Select Neighborhood *</Label>
              <Select value={selectedNeighborhoodId} onValueChange={setSelectedNeighborhoodId}>
                <SelectTrigger id="neighborhood-select">
                  <SelectValue placeholder="Choose a neighborhood..." />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood.id} value={neighborhood.id}>
                      {neighborhood.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(locationType === "facility" || locationType === "walking_path") && neighborhoods.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Neighborhood (Optional)</Label>
              <Select value={selectedNeighborhoodId} onValueChange={setSelectedNeighborhoodId}>
                <SelectTrigger id="neighborhood">
                  <SelectValue placeholder="Choose a neighborhood..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {neighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood.id} value={neighborhood.id}>
                      {neighborhood.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              {locationType === "lot" ? "Lot Number" : locationType === "neighborhood" ? "Neighborhood Name" : "Name *"}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                locationType === "lot"
                  ? "Select a lot first"
                  : locationType === "neighborhood"
                    ? "Select a neighborhood first"
                    : "e.g., Community Pool"
              }
              disabled={locationType === "lot" || locationType === "neighborhood"}
            />
          </div>

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
                  placeholder="e.g., 🏊 or pool"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="photos">Photos</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  id="photos"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("photos")?.click()}
                  disabled={uploadingPhoto}
                  className="w-full"
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photos
                    </>
                  )}
                </Button>
              </div>

              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {uploadedPhotos.map((url, index) => (
                    <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removePhoto(url)}
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {uploadedPhotos.length === 0 && (
                <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg text-muted-foreground">
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No photos uploaded</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingLocationId ? "Update Location" : "Save Location"}
            </Button>
            {editingLocationId && (
              <>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="w-full">
                  {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Location
                </Button>
                <Button variant="outline" onClick={handleCancelEdit} className="w-full bg-transparent">
                  Cancel Edit
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => router.push(`/t/${tenantSlug}/admin/map`)} className="w-full">
              {editingLocationId ? "Back" : "Cancel"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
