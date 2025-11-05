"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useMap } from "@vis.gl/react-google-maps"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createLocation, updateLocation, deleteLocation } from "@/app/actions/locations"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import { geolocate } from "@/lib/geolocate"
import { APIProvider, Map, Marker, Polygon, Polyline } from "@vis.gl/react-google-maps"
import { Button } from "@/components/ui/button"

type DrawingMode = "marker" | "polygon" | "polyline" | null
type LatLng = { lat: number; lng: number }

interface GoogleMapEditorProps {
  tenantSlug: string
  tenantId: string
  lots?: Array<{ id: string; lot_number: string; address: string | null; neighborhoods: { name: string } | null }>
  neighborhoods?: Array<{ id: string; name: string }>
  mode?: "view" | "edit"
  initialLocations?: any[]
  mapCenter?: { lat: number; lng: number } | null
  mapZoom?: number
  initialHighlightLocationId?: string
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
  lots = [],
  neighborhoods = [],
  mode = "edit",
  initialLocations = [],
  mapCenter: initialMapCenter,
  mapZoom: initialMapZoom,
  initialHighlightLocationId,
}: GoogleMapEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const preselectedNeighborhoodId = searchParams.get("neighborhoodId")
  const preselectedLotId = searchParams.get("lotId")
  const prefilledName = searchParams.get("name")
  const prefilledDescription = searchParams.get("description")
  const editLocationIdFromUrl = searchParams.get("editLocationId")
  const isPreviewMode = searchParams.get("preview") === "true"

  const isEditingLot = !!preselectedLotId
  const isEditingNeighborhood = !!preselectedNeighborhoodId

  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null)
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">("satellite")
  const [saving, setSaving] = useState(false)
  const [mapCenter, setMapCenter] = useState<LatLng>(initialMapCenter || { lat: 9.9567, lng: -84.5333 })
  const [mapZoom, setMapZoom] = useState(initialMapZoom || 15)

  const [markerPosition, setMarkerPosition] = useState<LatLng | null>(null)
  const [polygonPoints, setPolygonPoints] = useState<LatLng[]>([])
  const [polylinePoints, setPolylinePoints] = useState<LatLng[]>([])
  const [savedLocations, setSavedLocations] = useState<any[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [locationType, setLocationType] = useState<"facility" | "lot" | "walking_path" | "neighborhood" | "boundary">(
    "facility",
  )
  const [facilityType, setFacilityType] = useState("")
  const [icon, setIcon] = useState("")
  const [selectedLotId, setSelectedLotId] = useState<string>("")
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>("")

  const [previewFeatures, setPreviewFeatures] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)

  // State for toggling visibility of different location types on the map
  const [showFacilities, setShowFacilities] = useState(true)
  const [showLots, setShowLots] = useState(true)
  const [showWalkingPaths, setShowWalkingPaths] = useState(true)
  const [showNeighborhoods, setShowNeighborhoods] = useState(true)

  // State for hover and selection
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null)
  const [highlightedLocationId, setHighlightedLocationId] = useState<string | undefined>(undefined)
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)

  // State for photo uploads
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])

  // State for deletion
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (mode === "view") {
      setSavedLocations(initialLocations)
      return
    }

    const loadLocations = async () => {
      const supabase = createBrowserClient()
      const { data } = await supabase.from("locations").select("*").eq("tenant_id", tenantId)
      if (data) {
        setSavedLocations(data)

        if (editLocationIdFromUrl) {
          const locationToEdit = data.find((loc) => loc.id === editLocationIdFromUrl)
          if (locationToEdit) {
            console.log("[v0] Auto-loading location for editing:", locationToEdit)
            // Don't call handleLocationClick yet, just highlight it
            // User needs to click it to start editing
          }
        }
      }
    }
    loadLocations()
  }, [tenantId, editLocationIdFromUrl, mode, initialLocations])

  useEffect(() => {
    if (isPreviewMode) {
      const previewData = sessionStorage.getItem("geojson-preview")
      if (previewData) {
        try {
          const parsed = JSON.parse(previewData)
          console.log("[v0] Preview data loaded:", parsed)

          setPreviewFeatures(parsed.features || [])
          setIsImporting(true)

          if (parsed.features && parsed.features.length > 0) {
            let minLat = Number.POSITIVE_INFINITY,
              maxLat = Number.NEGATIVE_INFINITY
            let minLng = Number.POSITIVE_INFINITY,
              maxLng = Number.NEGATIVE_INFINITY

            parsed.features.forEach((feature: any) => {
              const coords = feature.geometry.coordinates
              console.log("[v0] Feature geometry:", feature.geometry.type, "coords:", coords)

              if (feature.geometry.type === "Point") {
                const [lng, lat] = coords
                console.log("[v0] Point coords - lng:", lng, "lat:", lat)
                minLat = Math.min(minLat, lat)
                maxLat = Math.max(maxLat, lat)
                minLng = Math.min(minLng, lng)
                maxLng = Math.max(maxLng, lng)
              } else if (feature.geometry.type === "LineString") {
                coords.forEach((coord: number[]) => {
                  const [lng, lat] = coord
                  console.log("[v0] LineString point - lng:", lng, "lat:", lat)
                  minLat = Math.min(minLat, lat)
                  maxLat = Math.max(maxLat, lat)
                  minLng = Math.min(minLng, lng)
                  maxLng = Math.max(maxLng, lng)
                })
              } else if (feature.geometry.type === "Polygon") {
                coords[0].forEach((coord: number[]) => {
                  const [lng, lat] = coord
                  console.log("[v0] Polygon point - lng:", lng, "lat:", lat)
                  minLat = Math.min(minLat, lat)
                  maxLat = Math.max(maxLat, lat)
                  minLng = Math.min(minLng, lng)
                  maxLng = Math.max(maxLng, lng)
                })
              }
            })

            const latPadding = (maxLat - minLat) * 0.1
            const lngPadding = (maxLng - minLng) * 0.1

            minLat -= latPadding
            maxLat += latPadding
            minLng -= lngPadding
            maxLng += lngPadding

            // Calculate center
            const centerLat = (minLat + maxLat) / 2
            const centerLng = (minLng + maxLng) / 2

            console.log("[v0] Calculated bounds with padding:", { minLat, maxLat, minLng, maxLng })
            console.log("[v0] Calculated center:", { lat: centerLat, lng: centerLng })

            setMapCenter({ lat: centerLat, lng: centerLng })

            const latDiff = maxLat - minLat
            const lngDiff = maxLng - minLng
            const maxDiff = Math.max(latDiff, lngDiff)

            // Calculate zoom based on bounds size
            // Rough approximation: each zoom level halves the visible area
            let zoom = 15 // Default zoom

            if (maxDiff > 10) zoom = 6
            else if (maxDiff > 5) zoom = 7
            else if (maxDiff > 2) zoom = 8
            else if (maxDiff > 1) zoom = 9
            else if (maxDiff > 0.5) zoom = 10
            else if (maxDiff > 0.25) zoom = 11
            else if (maxDiff > 0.1) zoom = 12
            else if (maxDiff > 0.05) zoom = 13
            else if (maxDiff > 0.025) zoom = 14
            else if (maxDiff > 0.01) zoom = 15
            else if (maxDiff > 0.005) zoom = 16
            else zoom = 17

            zoom = Math.max(10, Math.min(18, zoom))

            console.log("[v0] Setting zoom to:", zoom, "based on maxDiff:", maxDiff)
            setMapZoom(zoom)
          }

          toast({
            title: "GeoJSON Loaded",
            description: `${parsed.features?.length || 0} feature(s) ready to import`,
          })
        } catch (error) {
          console.error("[v0] Error loading preview data:", error)
          toast({
            title: "Error",
            description: "Failed to load preview data",
            variant: "destructive",
          })
        }
      }
    }
  }, [isPreviewMode, toast])

  useEffect(() => {
    if (mode === "view" && initialHighlightLocationId) {
      const location = savedLocations.find((loc) => loc.id === initialHighlightLocationId)
      if (location) {
        setSelectedLocation(location)

        // Center map on highlighted location
        if (location.coordinates) {
          setMapCenter(location.coordinates)
          setMapZoom(18)
        } else if (location.boundary_coordinates && location.boundary_coordinates.length > 0) {
          const firstCoord = location.boundary_coordinates[0]
          setMapCenter({ lat: firstCoord[0], lng: firstCoord[1] })
          setMapZoom(17)
        } else if (location.path_coordinates && location.path_coordinates.length > 0) {
          const firstCoord = location.path_coordinates[0]
          setMapCenter({ lat: firstCoord[0], lng: firstCoord[1] })
          setMapZoom(17)
        }
      }
    }
  }, [mode, initialHighlightLocationId, savedLocations])

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
    console.log("[v0] handleLocationClick called", { mode, locationId: location.id, highlightedLocationId })

    if (mode === "view") {
      if (highlightedLocationId && highlightedLocationId !== location.id) {
        console.log("[v0] Clearing highlight because clicked different location")
        setHighlightedLocationId(undefined)
      }
      setSelectedLocation(location)
      return
    }

    // Edit mode logic
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
    console.log("[v0] handleMapClick called", { mode, lat, lng, highlightedLocationId })

    if (mode === "view") {
      if (highlightedLocationId) {
        console.log("[v0] Clearing highlight because clicked empty space")
      }
      setHighlightedLocationId(undefined)
      setSelectedLocation(null)
      return
    }

    // Edit mode logic
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
    setDrawingMode(null)
    toast({
      description: "Edit cancelled",
    })
  }

  const handleDelete = async () => {
    if (!editingLocationId) return

    const supabase = createBrowserClient()
    const locationToDelete = savedLocations.find((loc) => loc.id === editingLocationId)

    let warningMessage = "Are you sure you want to delete this location? This action cannot be undone."

    if (locationToDelete?.lot_id) {
      const { data: linkedLot } = await supabase
        .from("lots")
        .select("lot_number")
        .eq("location_id", editingLocationId)
        .maybeSingle()

      if (linkedLot) {
        warningMessage = `This location is linked to Lot ${linkedLot.lot_number}. Deleting will unlink it. Continue?`
      }
    }

    if (locationToDelete?.neighborhood_id && locationToDelete?.type === "neighborhood") {
      const { data: linkedNeighborhood } = await supabase
        .from("neighborhoods")
        .select("name")
        .eq("location_id", editingLocationId)
        .maybeSingle()

      if (linkedNeighborhood) {
        warningMessage = `This location is linked to Neighborhood "${linkedNeighborhood.name}". Deleting will unlink it. Continue?`
      }
    }

    const confirmed = window.confirm(warningMessage)
    if (!confirmed) return

    setDeleting(true)

    try {
      await deleteLocation(editingLocationId, tenantId)

      toast({
        title: "Success",
        description: "Location deleted successfully!",
      })

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

  // TODO: Get API key from environment variables
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

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

  // Handle Save/Cancel for GeoJSON Import
  const handleSaveImport = async () => {
    if (!locationType) {
      toast({
        title: "Validation Error",
        description: "Please select a location type",
        variant: "destructive",
      })
      return
    }

    if (previewFeatures.length === 0) {
      toast({
        title: "Validation Error",
        description: "No features to import",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const supabase = createBrowserClient()
      const createdLocations = []

      for (const feature of previewFeatures) {
        const locationData: any = {
          tenant_id: tenantId,
          name: feature.properties?.name || `Imported ${feature.geometry.type}`,
          type: locationType,
          description: feature.properties?.description || null,
        }

        if (feature.geometry.type === "Point") {
          locationData.coordinates = {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
          }
        } else if (feature.geometry.type === "LineString") {
          locationData.path_coordinates = feature.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]])
        } else if (feature.geometry.type === "Polygon") {
          locationData.boundary_coordinates = feature.geometry.coordinates[0].map((coord: number[]) => [
            coord[1],
            coord[0],
          ])
        }

        const { data, error } = await supabase.from("locations").insert(locationData).select().single()

        if (error) throw error
        createdLocations.push(data)
      }

      toast({
        title: "Success",
        description: `${createdLocations.length} location(s) created successfully!`,
      })

      // Clear preview data
      sessionStorage.removeItem("geojson-preview")
      setPreviewFeatures([])
      setIsImporting(false)

      // Reload locations
      const { data } = await supabase.from("locations").select("*").eq("tenant_id", tenantId)
      if (data) {
        setSavedLocations(data)
      }

      // Redirect back to map
      router.push(`/t/${tenantSlug}/admin/map`)
    } catch (error) {
      console.error("[v0] Error importing locations:", error)
      toast({
        title: "Error",
        description: "Error importing locations: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelImport = () => {
    sessionStorage.removeItem("geojson-preview")
    setPreviewFeatures([])
    setIsImporting(false)
    router.push(`/t/${tenantSlug}/admin/map`)
  }

  return (
    <div className={mode === "view" ? "h-full" : "grid gap-6 lg:grid-cols-[1fr_400px]"}>
      <Card className={mode === "view" ? "h-full" : "min-h-[600px]"}>
        <CardContent className="p-1.5 h-full">
          <div className="relative h-full w-full overflow-hidden rounded-md">
            <APIProvider apiKey={apiKey}>
              <Map
                center={mapCenter}
                zoom={mapZoom}
                mapTypeId={mapType}
                mapId="community-map"
                gestureHandling="greedy"
                disableDefaultUI={true}
                onCenterChanged={(e) => setMapCenter(e.detail.center)}
                onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
              >
                <MapClickHandler drawingMode={drawingMode} onMapClick={handleMapClick} />

                {/* Preview Features (GeoJSON Import) */}
                {previewFeatures.map((feature, idx) => {
                  if (feature.geometry.type === "Point") {
                    const [lng, lat] = feature.geometry.coordinates
                    return <Marker key={`preview-${idx}`} position={{ lat, lng }} />
                  } else if (feature.geometry.type === "LineString") {
                    const path = feature.geometry.coordinates.map((coord: number[]) => ({
                      lat: coord[1],
                      lng: coord[0],
                    }))
                    return (
                      <Polyline
                        key={`preview-${idx}`}
                        path={path}
                        strokeColor="#a855f7"
                        strokeOpacity={0.8}
                        strokeWeight={1.5}
                      />
                    )
                  } else if (feature.geometry.type === "Polygon") {
                    const paths = feature.geometry.coordinates[0].map((coord: number[]) => ({
                      lat: coord[1],
                      lng: coord[0],
                    }))
                    return (
                      <Polygon
                        key={`preview-${idx}`}
                        paths={paths}
                        strokeColor="#a855f7"
                        strokeOpacity={0.8}
                        strokeWeight={1.5}
                        fillColor="#c084fc"
                        fillOpacity={0.2}
                      />
                    )
                  }
                  return null
                })}

                {/* Saved Locations */}
                {filteredLocations.map((location) => {
                  const isEditing = editingLocationId === location.id
                  const isHovered = hoveredLocationId === location.id

                  if (location.coordinates) {
                    return (
                      <Marker
                        key={location.id}
                        position={location.coordinates}
                        onClick={() => handleLocationClick(location)}
                      />
                    )
                  }

                  if (location.boundary_coordinates) {
                    const paths = location.boundary_coordinates.map((coord) => ({ lat: coord[0], lng: coord[1] }))
                    let strokeColor = "#fb923c"
                    let fillColor = "#fdba74"

                    if (location.type === "lot") {
                      strokeColor = "#60a5fa"
                      fillColor = "#93c5fd"
                    } else if (location.type === "neighborhood") {
                      strokeColor = "#a855f7"
                      fillColor = "#c084fc"
                    }

                    return (
                      <Polygon
                        key={location.id}
                        paths={paths}
                        strokeColor={isEditing || isHovered ? "#ef4444" : strokeColor}
                        strokeOpacity={isEditing || isHovered ? 1 : 0.7}
                        strokeWeight={isEditing || isHovered ? 4 : 2}
                        fillColor={isEditing || isHovered ? "#fca5a5" : fillColor}
                        fillOpacity={isEditing || isHovered ? 0.4 : 0.25}
                        onClick={() => handleLocationClick(location)}
                      />
                    )
                  }

                  if (location.path_coordinates) {
                    const path = location.path_coordinates.map((coord) => ({ lat: coord[0], lng: coord[1] }))
                    return (
                      <Polyline
                        path={path}
                        strokeColor={isEditing || isHovered ? "#ef4444" : "#3b82f6"}
                        strokeOpacity={isEditing || isHovered ? 1 : 0.8}
                        strokeWeight={isEditing || isHovered ? 5 : 3}
                        onClick={() => handleLocationClick(location)}
                      />
                    )
                  }

                  return null
                })}

                {/* Current Drawing */}
                {markerPosition && <Marker position={markerPosition} />}
                {polygonPoints.length > 0 && (
                  <Polygon
                    paths={polygonPoints}
                    strokeColor="#10b981"
                    strokeOpacity={0.8}
                    strokeWeight={2}
                    fillColor="#34d399"
                    fillOpacity={0.35}
                  />
                )}
                {polylinePoints.length > 0 && (
                  <Polyline path={polylinePoints} strokeColor="#10b981" strokeOpacity={0.8} strokeWeight={3} />
                )}
              </Map>
            </APIProvider>
          </div>
        </CardContent>
      </Card>

      {mode === "edit" && !isImporting && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold">{editingLocationId ? "Edit Location" : "Add New Location"}</h3>
              <p className="text-sm text-muted-foreground">Form UI placeholder</p>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === "edit" && isImporting && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Import GeoJSON</h3>
              <p className="text-sm text-muted-foreground">{previewFeatures.length} feature(s) ready to import</p>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location Type</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as any)}
                  className="w-full p-2 border rounded"
                >
                  <option value="facility">Facility</option>
                  <option value="lot">Lot</option>
                  <option value="walking_path">Walking Path</option>
                  <option value="neighborhood">Neighborhood</option>
                  <option value="boundary">Boundary</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveImport} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Save Import"}
                </Button>
                <Button onClick={handleCancelImport} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
