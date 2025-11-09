"use client"

import React from "react"

// import type React from "react" // Removed to fix redeclaration error

import { useState, useEffect, useRef } from "react"
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
  Plus,
} from "lucide-react"
import { Polygon } from "./polygon"
import { Polyline } from "./polyline"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import { geolocate } from "@/lib/geolocate"
import { Badge } from "@/components/ui/badge"
import { LocationInfoCard } from "./location-info-card"
import { RichTextEditor } from "@/components/ui/rich-text-editor" // Assuming RichTextEditor is in the same directory
import { PhotoManager } from "@/components/photo-manager"

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
  const [mapCenter, setMapCenter] = useState<LatLng>(() => {
    // Calculate initial center from boundary if available
    if (mode === "view" && initialLocations.length > 0) {
      const boundaryLocs = initialLocations.filter((loc) => loc.type === "boundary")
      if (boundaryLocs.length > 0 && boundaryLocs[0].boundary_coordinates?.length > 0) {
        const coords = boundaryLocs[0].boundary_coordinates
        let minLat = Number.POSITIVE_INFINITY
        let maxLat = Number.NEGATIVE_INFINITY
        let minLng = Number.POSITIVE_INFINITY
        let maxLng = Number.NEGATIVE_INFINITY

        coords.forEach((coord: [number, number]) => {
          const [lat, lng] = coord
          minLat = Math.min(minLat, lat)
          maxLat = Math.max(maxLat, lat)
          minLng = Math.min(minLng, lng)
          maxLng = Math.max(maxLng, lng)
        })

        return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }
      }
    }
    return initialMapCenter || { lat: 9.9567, lng: -84.5333 }
  })

  const [mapZoom, setMapZoom] = useState(() => {
    // Calculate initial zoom from boundary if available
    if (mode === "view" && initialLocations.length > 0) {
      const boundaryLocs = initialLocations.filter((loc) => loc.type === "boundary")
      if (boundaryLocs.length > 0 && boundaryLocs[0].boundary_coordinates?.length > 0) {
        const coords = boundaryLocs[0].boundary_coordinates
        let minLat = Number.POSITIVE_INFINITY
        let maxLat = Number.NEGATIVE_INFINITY
        let minLng = Number.POSITIVE_INFINITY
        let maxLng = Number.NEGATIVE_INFINITY

        coords.forEach((coord: [number, number]) => {
          const [lat, lng] = coord
          minLat = Math.min(minLat, lat)
          maxLat = Math.max(maxLat, lat)
          minLng = Math.min(minLng, lng)
          maxLng = Math.max(maxLng, lng)
        })

        const latDiff = maxLat - minLat
        const lngDiff = maxLng - minLng
        const maxDiff = Math.max(latDiff, lngDiff)

        let zoom = 15
        if (maxDiff > 0.01) zoom = 14
        if (maxDiff > 0.05) zoom = 13
        if (maxDiff > 0.1) zoom = 12
        if (maxDiff > 0.5) zoom = 10
        if (maxDiff > 1) zoom = 9

        return zoom
      }
    }
    return initialMapZoom || 15
  })

  const [markerPosition, setMarkerPosition] = useState<LatLng | null>(null)
  const [polygonPoints, setPolygonPoints] = useState<LatLng[]>([])
  const [polylinePoints, setPolylinePoints] = useState<LatLng[]>([])
  const [savedLocations, setSavedLocations] = useState<any[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [locationType, setLocationType] = useState<
    | "facility"
    | "lot"
    | "walking_path"
    | "neighborhood"
    | "boundary"
    | "protection_zone"
    | "easement"
    | "playground"
    | "public_street"
    | "green_area"
    | "recreational_zone"
  >("facility")
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
  const [showBoundaries, setShowBoundaries] = useState(true)
  const [showProtectionZones, setShowProtectionZones] = useState(true)
  const [showEasements, setShowEasements] = useState(true)
  const [showPlaygrounds, setShowPlaygrounds] = useState(true)
  const [showPublicStreets, setShowPublicStreets] = useState(true)
  const [showGreenAreas, setShowGreenAreas] = useState(true)
  const [showRecreationalZones, setShowRecreationalZones] = useState(true)

  // State for hover and selection
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null)
  const [highlightedLocationId, setHighlightedLocationId] = useState<string | undefined>(undefined)
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)

  // State for photo uploads
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null)

  // State for deletion
  const [deleting, setDeleting] = useState(false)

  // Existing state for facilities
  const [capacity, setCapacity] = useState("")
  const [maxOccupancy, setMaxOccupancy] = useState("")
  const [amenities, setAmenities] = useState<string[]>([])
  const [customAmenities, setCustomAmenities] = useState("")
  const [hours, setHours] = useState("")
  const [status, setStatus] = useState("Open") // Set default to 'Open' to match constraint
  const [parkingAvailable, setParkingAvailable] = useState(false)
  const [parkingSpaces, setParkingSpaces] = useState("")
  const [accessibilityFeatures, setAccessibilityFeatures] = useState<string[]>([])
  const [accessibilityNotes, setAccessibilityNotes] = useState("")
  const [rules, setRules] = useState("")

  // State for walking paths
  const [pathDifficulty, setPathDifficulty] = useState("")
  const [pathSurface, setPathSurface] = useState("")
  const [pathLength, setPathLength] = useState("")
  const [pathLengthUnit, setPathLengthUnit] = useState("km")
  const [elevationGain, setElevationGain] = useState("")
  const [elevationUnit, setElevationUnit] = useState("m")

  // Predefined options
  const AMENITY_OPTIONS = [
    "WiFi",
    "Parking Available",
    "Restrooms",
    "Showers",
    "BBQ Grills",
    "Playground Equipment",
    "Covered Area",
    "Electricity Outlets",
    "Water Access",
    "Tables & Benches",
    "Night Lighting",
    "Security Camera",
    "Kitchen Facilities",
    "Air Conditioning",
    "Heating",
    "First Aid Kit",
  ]

  const ACCESSIBILITY_OPTIONS = [
    "Wheelchair Accessible",
    "Accessible Parking",
    "Ramps Available",
    "Elevator Access",
    "Accessible Restrooms",
    "Wide Doorways",
  ]

  const mapRef = useRef(null)

  useEffect(() => {
    if (mode === "view") {
      setSavedLocations(initialLocations)
      return
    }

    const loadLocations = async () => {
      const supabase = createBrowserClient()
      const { data } = await supabase.from("locations").select("*").eq("tenant_id", tenantId)
      if (data) {
        console.log("[v0] Loaded locations in edit mode:", data.length)
        setSavedLocations(data)

        const boundaryLoc = data.find((loc) => loc.type === "boundary")
        if (boundaryLoc?.boundary_coordinates?.length > 0) {
          const coords = boundaryLoc.boundary_coordinates
          let minLat = Number.POSITIVE_INFINITY
          let maxLat = Number.NEGATIVE_INFINITY
          let minLng = Number.POSITIVE_INFINITY
          let maxLng = Number.NEGATIVE_INFINITY

          coords.forEach((coord: [number, number]) => {
            const [lat, lng] = coord
            minLat = Math.min(minLat, lat)
            maxLat = Math.max(maxLat, lat)
            minLng = Math.min(minLng, lng)
            maxLng = Math.max(maxLng, lng)
          })

          const center = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }
          setMapCenter(center)

          const latDiff = maxLat - minLat
          const lngDiff = maxLng - minLng
          const maxDiff = Math.max(latDiff, lngDiff)

          let zoom = 15
          if (maxDiff > 0.01) zoom = 14
          if (maxDiff > 0.05) zoom = 13
          if (maxDiff > 0.1) zoom = 12
          if (maxDiff > 0.5) zoom = 10
          if (maxDiff > 1) zoom = 9

          setMapZoom(zoom)
          console.log("[v0] Set map center and zoom from boundary:", center, zoom)
        }
      }
    }
    loadLocations()
  }, [tenantId, mode])

  useEffect(() => {
    if (isPreviewMode) {
      const previewData = sessionStorage.getItem("geojson-preview")
      if (previewData) {
        try {
          const parsed = JSON.parse(previewData)
          setPreviewFeatures(parsed.features || [])
          setIsImporting(true)

          if (parsed.features && parsed.features.length > 0) {
            let minLat = Number.POSITIVE_INFINITY,
              maxLat = Number.NEGATIVE_INFINITY
            let minLng = Number.POSITIVE_INFINITY,
              maxLng = Number.NEGATIVE_INFINITY

            parsed.features.forEach((feature: any) => {
              const coords = feature.geometry.coordinates
              if (feature.geometry.type === "Point") {
                const [lng, lat] = coords
                minLat = Math.min(minLat, lat)
                maxLat = Math.max(maxLat, lat)
                minLng = Math.min(minLng, lng)
                maxLng = Math.max(maxLng, lng)
              } else if (feature.geometry.type === "LineString") {
                coords.forEach((coord: number[]) => {
                  const [lng, lat] = coord
                  minLat = Math.min(minLat, lat)
                  maxLat = Math.max(maxLat, lat)
                  minLng = Math.min(minLng, lng)
                  maxLng = Math.max(maxLng, lng)
                })
              } else if (feature.geometry.type === "Polygon") {
                coords[0].forEach((coord: number[]) => {
                  const [lng, lat] = coord
                  minLat = Math.min(minLat, lat)
                  maxLat = Math.max(maxLat, lat)
                  minLng = Math.min(minLng, lng)
                  maxLng = Math.max(maxLng, lng)
                })
              }
            })

            const centerLat = (minLat + maxLat) / 2
            const centerLng = (minLng + maxLng) / 2

            setMapCenter({ lat: centerLat, lng: centerLng })

            const latDiff = maxLat - minLat
            const lngDiff = maxLng - minLng
            const maxDiff = Math.max(latDiff, lngDiff)

            let zoom = 15
            if (maxDiff > 0.1) zoom = 12
            if (maxDiff > 0.5) zoom = 10
            if (maxDiff > 1) zoom = 9
            if (maxDiff > 5) zoom = 7

            setMapZoom(zoom)
          }

          toast({
            title: "GeoJSON Loaded",
            description: `${parsed.features?.length || 0} feature(s) ready to import`,
          })
        } catch (error) {
          console.error("Error loading preview data:", error)
          toast({
            title: "Error",
            description: "Failed to load preview data",
            variant: "destructive",
          })
        }
      }
    }
  }, []) // Only run once on mount

  useEffect(() => {
    if (mode === "view" && initialHighlightLocationId) {
      const location = savedLocations.find((loc) => loc.id === initialHighlightLocationId)
      if (location) {
        setSelectedLocation(location)
        setHighlightedLocationId(initialHighlightLocationId)

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
    if (mode === "view") {
      setHighlightedLocationId(location.id)
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
    setHeroPhoto(location.hero_photo || (location.photos && location.photos.length > 0 ? location.photos[0] : null))

    // Load new attributes
    setCapacity(location.capacity?.toString() || "")
    setMaxOccupancy(location.max_occupancy?.toString() || "")
    setAmenities(location.amenities || [])
    setCustomAmenities("") // Clear custom amenities, will be populated if needed on save
    setHours(location.hours || "")
    setStatus(location.status || "")
    setParkingAvailable(!!location.parking_spaces)
    setParkingSpaces(location.parking_spaces?.toString() || "")
    // Accessibility needs careful handling as it's stored as a string
    if (location.accessibility_features) {
      const features = location.accessibility_features.split(" | ")
      setAccessibilityFeatures(features.filter((f: string) => ACCESSIBILITY_OPTIONS.includes(f)))
      setAccessibilityNotes(features.find((f: string) => f.startsWith("Notes:"))?.replace("Notes: ", "") || "")
    } else {
      setAccessibilityFeatures([])
      setAccessibilityNotes("")
    }
    setRules(location.rules || "")

    // Load path attributes
    setPathDifficulty(location.path_difficulty || "")
    setPathSurface(location.path_surface || "")
    if (location.path_length) {
      const [length, unit] = location.path_length.split(" ")
      setPathLength(length)
      setPathLengthUnit(unit || "km")
    } else {
      setPathLength("")
      setPathLengthUnit("km")
    }
    if (location.elevation_gain) {
      const [gain, unit] = location.elevation_gain.split(" ")
      setElevationGain(gain)
      setElevationUnit(unit || "m")
    } else {
      setElevationGain("")
      setElevationUnit("m")
    }

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
    // Clear selection when clicking on empty space
    setHighlightedLocationId(undefined)
    setSelectedLocation(null)

    if (mode === "view") {
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
      console.error("Photo upload error:", error)
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
    if (heroPhoto === urlToRemove) {
      setHeroPhoto(null)
    }
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

    if (locationType === "facility" && !markerPosition && polygonPoints.length === 0 && !polylinePoints.length) {
      toast({
        title: "Validation Error",
        description: "Please place a marker, draw a boundary, or draw a path for the facility",
        variant: "destructive",
      })
      return
    }
    if (locationType === "lot" && polygonPoints.length < 3 && polylinePoints.length < 2) {
      toast({
        title: "Validation Error",
        description: "Please draw a boundary (at least 3 points) or a path (at least 2 points) for the lot",
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
        hero_photo: heroPhoto,
      }

      if (locationType === "facility") {
        if (markerPosition) {
          locationData.coordinates = markerPosition
        }
        if (polygonPoints.length > 0) {
          locationData.boundary_coordinates = polygonPoints.map((p) => [p.lat, p.lng])
        }
        if (polylinePoints.length > 0) {
          locationData.path_coordinates = polylinePoints.map((p) => [p.lat, p.lng])
        }
        if (facilityType) locationData.facility_type = facilityType
        if (icon) locationData.icon = icon
        if (selectedNeighborhoodId && selectedNeighborhoodId !== "none") {
          locationData.neighborhood_id = selectedNeighborhoodId
        }
        if (selectedLotId && selectedLotId !== "none") {
          locationData.lot_id = selectedLotId
        }

        if (capacity) locationData.capacity = Number.parseInt(capacity)
        if (maxOccupancy) locationData.max_occupancy = Number.parseInt(maxOccupancy)
        if (amenities.length > 0 || customAmenities) {
          const allAmenities = [...amenities]
          if (customAmenities) {
            allAmenities.push(
              ...customAmenities
                .split(",")
                .map((a) => a.trim())
                .filter(Boolean),
            )
          }
          locationData.amenities = allAmenities
        }
        if (hours) locationData.hours = hours
        if (status) locationData.status = status
        if (parkingAvailable && parkingSpaces) {
          locationData.parking_spaces = Number.parseInt(parkingSpaces)
        } else if (!parkingAvailable) {
          locationData.parking_spaces = 0
        }
        if (accessibilityFeatures.length > 0 || accessibilityNotes) {
          const accessibilityText = [...accessibilityFeatures, accessibilityNotes ? `Notes: ${accessibilityNotes}` : ""]
            .filter(Boolean)
            .join(" | ")
          locationData.accessibility_features = accessibilityText
        }
        if (rules) locationData.rules = rules
      } else if (locationType === "lot") {
        if (polygonPoints.length > 0) {
          locationData.boundary_coordinates = polygonPoints.map((p) => [p.lat, p.lng])
        }
        if (polylinePoints.length > 0) {
          locationData.path_coordinates = polylinePoints.map((p) => [p.lat, p.lng])
        }
        locationData.lot_id = selectedLotId
      } else if (locationType === "neighborhood") {
        locationData.boundary_coordinates = polygonPoints.map((p) => [p.lat, p.lng])
        locationData.neighborhood_id = selectedNeighborhoodId
      } else if (locationType === "walking_path") {
        locationData.path_coordinates = polylinePoints.map((p) => [p.lat, p.lng])
        if (selectedNeighborhoodId && selectedNeighborhoodId !== "none") {
          locationData.neighborhood_id = selectedNeighborhoodId
        }
        if (selectedLotId && selectedLotId !== "none") {
          locationData.lot_id = selectedLotId
        }

        // Add path attributes
        if (pathDifficulty) locationData.path_difficulty = pathDifficulty
        if (pathSurface) locationData.path_surface = pathSurface
        if (pathLength) locationData.path_length = `${pathLength} ${pathLengthUnit}`
        if (elevationGain) locationData.elevation_gain = `${elevationGain} ${elevationUnit}`
        if (status) locationData.status = status
      } else if (
        locationType === "boundary" ||
        locationType === "protection_zone" ||
        locationType === "easement" ||
        locationType === "playground" ||
        locationType === "public_street" ||
        locationType === "green_area" ||
        locationType === "recreational_zone"
      ) {
        locationData.boundary_coordinates = polygonPoints.map((p) => [p.lat, p.lng])
        if (selectedNeighborhoodId && selectedNeighborhoodId !== "none") {
          locationData.neighborhood_id = selectedNeighborhoodId
        }
        if (selectedLotId && selectedLotId !== "none") {
          locationData.lot_id = selectedLotId
        }
      }

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
      setHeroPhoto(null)
      setEditingLocationId(null)

      // Reset facility attributes
      setCapacity("")
      setMaxOccupancy("")
      setAmenities([])
      setCustomAmenities("")
      setHours("")
      setStatus("")
      setParkingAvailable(false)
      setParkingSpaces("")
      setAccessibilityFeatures([])
      setAccessibilityNotes("")
      setRules("")

      // Reset path attributes
      setPathDifficulty("")
      setPathSurface("")
      setPathLength("")
      setPathLengthUnit("km")
      setElevationGain("")
      setElevationUnit("m")

      setSaving(false) // Reset saving state immediately after form reset

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
      console.error("Error saving location:", error)
      toast({
        title: "Error",
        description: "Error saving location: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      })
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
    setHeroPhoto(null)
    setDrawingMode(null)
    setSaving(false)

    // Reset all new fields
    setCapacity("")
    setMaxOccupancy("")
    setAmenities([])
    setCustomAmenities("")
    setHours("")
    setStatus("")
    setParkingAvailable(false)
    setParkingSpaces("")
    setAccessibilityFeatures([])
    setAccessibilityNotes("")
    setRules("")

    setPathDifficulty("")
    setPathSurface("")
    setPathLength("")
    setPathLengthUnit("km")
    setElevationGain("")
    setElevationUnit("m")

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
        // Force map to re-render by updating a state that affects the key
        setIsImporting((prev) => !prev)
        setTimeout(() => setIsImporting((prev) => !prev), 0)
      }

      handleNewLocation()
      setDeleting(false)
    } catch (error) {
      console.error("Error deleting location:", error)
      toast({
        title: "Error",
        description: "Error deleting location: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      })
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
    setHeroPhoto(null)
    setDrawingMode(null)

    // Reset all new fields
    setCapacity("")
    setMaxOccupancy("")
    setAmenities([])
    setCustomAmenities("")
    setHours("")
    setStatus("")
    setParkingAvailable(false)
    setParkingSpaces("")
    setAccessibilityFeatures([])
    setAccessibilityNotes("")
    setRules("")

    setPathDifficulty("")
    setPathSurface("")
    setPathLength("")
    setPathLengthUnit("km")
    setElevationGain("")
    setElevationUnit("m")

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

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const DEMO_MAP_ID = "DEMO_MAP_ID"
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || DEMO_MAP_ID

  const filteredLocations = savedLocations.filter((location) => {
    if (location.type === "facility") return showFacilities
    if (location.type === "lot") return showLots
    if (location.type === "walking_path") return showWalkingPaths
    if (location.type === "neighborhood") return showNeighborhoods
    if (location.type === "boundary") return showBoundaries
    if (location.type === "protection_zone") return showProtectionZones
    if (location.type === "easement") return showEasements
    if (location.type === "playground") return showPlaygrounds
    if (location.type === "public_street") return showPublicStreets
    if (location.type === "green_area") return showGreenAreas
    if (location.type === "recreational_zone") return showRecreationalZones
    return true
  })

  const hasType = (type: string) => {
    const existingLocationTypes = new Set(savedLocations.map((loc) => loc.type))
    return existingLocationTypes.has(type)
  }

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

        // Added neighborhood and lot linking for imported locations
        if (selectedNeighborhoodId && selectedNeighborhoodId !== "none") {
          locationData.neighborhood_id = selectedNeighborhoodId
        }
        if (selectedLotId && selectedLotId !== "none") {
          locationData.lot_id = selectedLotId
        }

        const { data, error } = await supabase.from("locations").insert(locationData).select().single()

        if (error) throw error
        createdLocations.push(data)
      }

      toast({
        title: "Success",
        description: `${createdLocations.length} location(s) created successfully!`,
      })

      sessionStorage.removeItem("geojson-preview")
      setPreviewFeatures([])
      setIsImporting(false)

      const { data } = await supabase.from("locations").select("*").eq("tenant_id", tenantId)
      if (data) {
        setSavedLocations(data)
      }

      router.push(`/t/${tenantSlug}/admin/map`)
    } catch (error) {
      console.error("Error importing locations:", error)
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

  const convertCoordinates = (coords: [number, number][]) => {
    return coords.map((coord) => ({
      lat: coord[0],
      lng: coord[1],
    }))
  }

  const boundaryLocation = savedLocations.find((loc) => loc.type === "boundary")

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <Card>
        <CardContent className="p-1.5">
          <div className="relative h-[600px] w-full overflow-hidden rounded-lg">
            <APIProvider apiKey={apiKey}>
              <Map
                ref={mapRef}
                center={mapCenter}
                zoom={mapZoom}
                mapTypeId={mapType} // Use state for map type
                gestureHandling="greedy"
                disableDefaultUI={true}
                clickableIcons={false}
                onClick={handleMapClick}
                onCenterChanged={(e) => setMapCenter(e.detail.center)}
                onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
                {...(mapId ? { mapId } : {})}
              >
                <MapClickHandler drawingMode={drawingMode} onMapClick={handleMapClick} />

                {mode === "edit" && markerPosition && <Marker position={markerPosition} />}

                {mode === "edit" && polygonPoints.length === 1 && <Marker position={polygonPoints[0]} />}

                {mode === "edit" && polygonPoints.length === 2 && (
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

                {mode === "edit" && polygonPoints.length >= 3 && (
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

                {mode === "edit" && polylinePoints.length === 1 && <Marker position={polylinePoints[0]} />}

                {mode === "edit" && polylinePoints.length >= 2 && (
                  <Polyline
                    key={`drawing-polyline-${polylinePoints.length}`}
                    path={polylinePoints}
                    strokeColor="#f59e0b"
                    strokeOpacity={0.8}
                    strokeWeight={3}
                    clickable={false}
                  />
                )}

                {isImporting &&
                  previewFeatures.map((feature, index) => {
                    if (feature.geometry.type === "Point") {
                      return (
                        <Marker
                          key={`preview-${index}`}
                          position={{
                            lat: feature.geometry.coordinates[1],
                            lng: feature.geometry.coordinates[0],
                          }}
                        />
                      )
                    } else if (feature.geometry.type === "LineString") {
                      const path = feature.geometry.coordinates.map((coord: number[]) => ({
                        lat: coord[1],
                        lng: coord[0],
                      }))
                      return (
                        <Polyline
                          key={`preview-${index}`}
                          path={path}
                          strokeColor="#a855f7"
                          strokeOpacity={0.9}
                          strokeWeight={4}
                          clickable={false}
                        />
                      )
                    } else if (feature.geometry.type === "Polygon") {
                      const paths = feature.geometry.coordinates[0].map((coord: number[]) => ({
                        lat: coord[1],
                        lng: coord[0],
                      }))
                      return (
                        <Polygon
                          key={`preview-${index}`}
                          paths={paths}
                          strokeColor="#a855f7"
                          strokeOpacity={0.9}
                          strokeWeight={3}
                          fillColor="#a855f7"
                          fillOpacity={0.3}
                          clickable={false}
                        />
                      )
                    }
                    return null
                  })}

                {boundaryLocation && boundaryLocation.boundary_coordinates && (
                  <Polygon
                    paths={convertCoordinates(boundaryLocation.boundary_coordinates)}
                    strokeColor="transparent"
                    strokeOpacity={0}
                    strokeWeight={0}
                    fillColor="#ffffff"
                    fillOpacity={0.15}
                    clickable={false}
                    zIndex={1}
                  />
                )}

                {filteredLocations.map((location) => {
                  const isEditing = mode === "edit" && editingLocationId === location.id
                  const isHovered = hoveredLocationId === location.id
                  const isHighlightedFromUrl = mode === "edit" && editLocationIdFromUrl === location.id
                  const isHighlightedInView = highlightedLocationId === location.id

                  const isSelected = isHighlightedInView || isHighlightedFromUrl || isEditing
                  const baseZIndex =
                    location.type === "boundary"
                      ? 1
                      : location.type === "public_street"
                        ? 15
                        : location.type === "lot"
                          ? 10
                          : location.type === "neighborhood"
                            ? 8
                            : location.type === "facility"
                              ? 20
                              : location.type === "walking_path"
                                ? 25
                                : 5
                  const zIndex = isSelected ? 200 : baseZIndex

                  const isBoundary = location.type === "boundary"
                  const isProtectionZone = location.type === "protection_zone"
                  const isEasement = location.type === "easement"
                  const isPlayground = location.type === "playground"
                  const isPublicStreet = location.type === "public_street"
                  const isGreenArea = location.type === "green_area"
                  const isRecreationalZone = location.type === "recreational_zone"
                  const isNeighborhood = location.type === "neighborhood"

                  if (location.type === "facility" && location.coordinates) {
                    return (
                      <Marker
                        key={`saved-${location.id}`}
                        position={location.coordinates}
                        onClick={() => handleLocationClick(location)}
                        title={location.name}
                        zIndex={zIndex}
                      />
                    )
                  }

                  if (location.type === "facility" && location.path_coordinates) {
                    const path = convertCoordinates(location.path_coordinates)
                    return (
                      <Polyline
                        key={`saved-${location.id}`}
                        path={path}
                        strokeColor={
                          isHighlightedFromUrl || isHighlightedInView ? "#ef4444" : isEditing ? "#10b981" : "#fb923c"
                        }
                        strokeOpacity={isHovered ? 1 : 0.9}
                        strokeWeight={isHighlightedFromUrl || isHighlightedInView || isEditing ? 3 : isHovered ? 2 : 1}
                        onClick={() => handleLocationClick(location)}
                        onMouseOver={() => setHoveredLocationId(location.id)}
                        onMouseOut={() => setHoveredLocationId(null)}
                        zIndex={zIndex}
                      />
                    )
                  }

                  if (
                    (location.type === "facility" ||
                      isNeighborhood ||
                      isBoundary ||
                      isProtectionZone ||
                      isEasement ||
                      isPlayground ||
                      isPublicStreet ||
                      isGreenArea ||
                      isRecreationalZone) &&
                    location.boundary_coordinates
                  ) {
                    const paths = convertCoordinates(location.boundary_coordinates)

                    let strokeColor = "#6b9b47"
                    let fillColor = "#6b9b47"

                    if (location.type === "facility") {
                      strokeColor = "#fb923c"
                      fillColor = "#fb923c"
                    } else if (location.type === "neighborhood") {
                      strokeColor = "#a855f7"
                      fillColor = "#a855f7"
                    } else if (isBoundary) {
                      strokeColor = "#000000" // Changed from white to transparent/invisible
                      fillColor = "#000000"
                    } else if (isProtectionZone) {
                      strokeColor = "#ef4444"
                      fillColor = "#ef4444"
                    } else if (isEasement) {
                      strokeColor = "#f59e0b"
                      fillColor = "#f59e0b"
                    } else if (isPlayground) {
                      strokeColor = "#ec4899"
                      fillColor = "#ec4899"
                    } else if (isPublicStreet) {
                      strokeColor = "#fbbf24"
                      fillColor = "#fbbf24"
                    } else if (isGreenArea) {
                      strokeColor = "#22c55e"
                      fillColor = "#22c55e"
                    } else if (isRecreationalZone) {
                      strokeColor = "#06b6d4"
                      fillColor = "#06b6d4"
                    }

                    if (isHighlightedFromUrl || isHighlightedInView) {
                      strokeColor = "#ef4444"
                      fillColor = "#60a5fa"
                    } else if (isEditing) {
                      strokeColor = "#10b981"
                      fillColor = "#60a5fa"
                    }

                    const isClickable = !isBoundary
                    const strokeOpacityValue = isBoundary ? 0 : isHovered ? 1 : 0.8

                    return (
                      <Polygon
                        key={`saved-${location.id}`}
                        paths={paths}
                        strokeColor={strokeColor}
                        strokeOpacity={strokeOpacityValue}
                        strokeWeight={isHighlightedFromUrl || isHighlightedInView || isEditing ? 3 : isHovered ? 2 : 1}
                        fillColor={fillColor}
                        fillOpacity={
                          isHighlightedFromUrl || isHighlightedInView || isEditing ? 0.4 : isHovered ? 0.3 : 0.25
                        }
                        onClick={isClickable ? () => handleLocationClick(location) : undefined}
                        onMouseOver={isClickable ? () => setHoveredLocationId(location.id) : undefined}
                        onMouseOut={isClickable ? () => setHoveredLocationId(null) : undefined}
                        zIndex={zIndex}
                      />
                    )
                  }

                  // Lot polylines with increased opacity and invisible wider line for easier clicking
                  if (location.type === "lot" && location.path_coordinates) {
                    const path = convertCoordinates(location.path_coordinates)
                    const isEditing = editingLocationId === location.id
                    const isHovered = hoveredLocationId === location.id
                    const isHighlightedFromUrl = editLocationIdFromUrl === location.id
                    const isHighlightedInView = highlightedLocationId === location.id

                    const zIndex = isHighlightedFromUrl || isHighlightedInView || isEditing ? 100 : 3

                    return (
                      <React.Fragment key={`saved-${location.id}`}>
                        {/* Invisible wider line for easier clicking */}
                        <Polyline
                          path={path}
                          strokeColor="transparent"
                          strokeOpacity={0}
                          strokeWeight={8}
                          onClick={() => handleLocationClick(location)}
                          onMouseOver={() => setHoveredLocationId(location.id)}
                          onMouseOut={() => setHoveredLocationId(null)}
                          zIndex={zIndex}
                        />
                        {/* Visible thin line */}
                        <Polyline
                          path={path}
                          strokeColor={
                            isHighlightedFromUrl || isHighlightedInView ? "#ef4444" : isEditing ? "#10b981" : "#60a5fa"
                          }
                          strokeOpacity={isHovered ? 1 : 0.9}
                          strokeWeight={
                            isHighlightedFromUrl || isHighlightedInView || isEditing ? 3 : isHovered ? 2 : 1
                          }
                          onClick={() => handleLocationClick(location)}
                          onMouseOver={() => setHoveredLocationId(location.id)}
                          onMouseOut={() => setHoveredLocationId(null)}
                          zIndex={zIndex + 1}
                        />
                      </React.Fragment>
                    )
                  }

                  // Lot polygons with lighter blue fill and invisible wider border for easier clicking
                  if (location.type === "lot" && location.boundary_coordinates) {
                    const paths = convertCoordinates(location.boundary_coordinates)
                    const isEditing = editingLocationId === location.id
                    const isHovered = hoveredLocationId === location.id
                    const isHighlightedFromUrl = editLocationIdFromUrl === location.id
                    const isHighlightedInView = highlightedLocationId === location.id

                    const zIndex = isHighlightedFromUrl || isHighlightedInView || isEditing ? 100 : 3

                    return (
                      <React.Fragment key={`saved-${location.id}`}>
                        {/* Invisible wider border for easier clicking */}
                        <Polygon
                          paths={paths}
                          strokeColor="transparent"
                          strokeOpacity={0}
                          strokeWeight={8}
                          fillColor="transparent"
                          fillOpacity={0}
                          onClick={() => handleLocationClick(location)}
                          onMouseOver={() => setHoveredLocationId(location.id)}
                          onMouseOut={() => setHoveredLocationId(null)}
                          zIndex={zIndex}
                        />
                        {/* Visible thin border with fill */}
                        <Polygon
                          paths={paths}
                          strokeColor={
                            isHighlightedFromUrl || isHighlightedInView ? "#ef4444" : isEditing ? "#10b981" : "#60a5fa"
                          }
                          strokeOpacity={isHovered ? 1 : 0.7}
                          strokeWeight={
                            isHighlightedFromUrl || isHighlightedInView || isEditing ? 3 : isHovered ? 2 : 1
                          }
                          fillColor={isHighlightedFromUrl || isHighlightedInView || isEditing ? "#bfdbfe" : "#bfdbfe"}
                          fillOpacity={
                            isHighlightedFromUrl || isHighlightedInView || isEditing ? 0.5 : isHovered ? 0.4 : 0.35
                          }
                          onClick={() => handleLocationClick(location)}
                          onMouseOver={() => setHoveredLocationId(location.id)}
                          onMouseOut={() => setHoveredLocationId(null)}
                          zIndex={zIndex + 1}
                        />
                      </React.Fragment>
                    )
                  }

                  if (location.type === "public_street" && location.path_coordinates) {
                    const path = convertCoordinates(location.path_coordinates)
                    return (
                      <Polyline
                        key={`saved-${location.id}`}
                        path={path}
                        strokeColor={
                          isHighlightedFromUrl || isHighlightedInView ? "#ef4444" : isEditing ? "#10b981" : "#fbbf24"
                        }
                        strokeOpacity={isHovered ? 1 : 0.95}
                        strokeWeight={isHighlightedFromUrl || isHighlightedInView || isEditing ? 3 : isHovered ? 2 : 1}
                        onClick={() => handleLocationClick(location)}
                        onMouseOver={() => setHoveredLocationId(location.id)}
                        onMouseOut={() => setHoveredLocationId(null)}
                        zIndex={zIndex}
                      />
                    )
                  }

                  if (location.type === "walking_path" && location.path_coordinates) {
                    const path = convertCoordinates(location.path_coordinates)
                    return (
                      <Polyline
                        key={`saved-${location.id}`}
                        path={path}
                        strokeColor={
                          isHighlightedFromUrl || isHighlightedInView ? "#ef4444" : isEditing ? "#10b981" : "#3b82f6"
                        }
                        strokeOpacity={isHovered ? 1 : 0.8}
                        strokeWeight={isHighlightedFromUrl || isHighlightedInView || isEditing ? 3 : isHovered ? 2 : 1}
                        onClick={() => handleLocationClick(location)}
                        onMouseOver={() => setHoveredLocationId(location.id)}
                        onMouseOut={() => setHoveredLocationId(null)}
                        zIndex={zIndex}
                      />
                    )
                  }
                  return null
                })}
              </Map>
            </APIProvider>

            {mode === "edit" && (
              <>
                <div className="absolute left-3 top-3 flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setMapZoom((prev) => prev + 1)}
                    className="h-10 w-10 shadow-lg"
                    title="Zoom In"
                  >
                    +
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setMapZoom((prev) => prev - 1)}
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
              </>
            )}

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
                  {hasType("facility") && (
                    <DropdownMenuCheckboxItem checked={showFacilities} onCheckedChange={setShowFacilities}>
                      Facilities
                    </DropdownMenuCheckboxItem>
                  )}
                  {hasType("lot") && (
                    <DropdownMenuCheckboxItem checked={showLots} onCheckedChange={setShowLots}>
                      Lots
                    </DropdownMenuCheckboxItem>
                  )}
                  {hasType("walking_path") && (
                    <DropdownMenuCheckboxItem checked={showWalkingPaths} onCheckedChange={setShowWalkingPaths}>
                      Walking Paths
                    </DropdownMenuCheckboxItem>
                  )}
                  {hasType("neighborhood") && (
                    <DropdownMenuCheckboxItem checked={showNeighborhoods} onCheckedChange={setShowNeighborhoods}>
                      Neighborhoods
                    </DropdownMenuCheckboxItem>
                  )}
                  {hasType("boundary") && (
                    <DropdownMenuCheckboxItem checked={showBoundaries} onCheckedChange={setShowBoundaries}>
                      Boundaries
                    </DropdownMenuCheckboxItem>
                  )}
                  {hasType("protection_zone") && (
                    <DropdownMenuCheckboxItem checked={showProtectionZones} onCheckedChange={setShowProtectionZones}>
                      Protection Zones
                    </DropdownMenuCheckboxItem>
                  )}
                  {hasType("easement") && (
                    <DropdownMenuCheckboxItem checked={showEasements} onCheckedChange={setShowEasements}>
                      Easements
                    </DropdownMenuCheckboxItem>
                  )}
                  {hasType("playground") && (
                    <DropdownMenuCheckboxItem checked={showPlaygrounds} onCheckedChange={setShowPlaygrounds}>
                      Playgrounds
                    </DropdownMenuCheckboxItem>
                  )}
                  {hasType("public_street") && (
                    <DropdownMenuCheckboxItem checked={showPublicStreets} onCheckedChange={setShowPublicStreets}>
                      Public Streets
                    </DropdownMenuCheckboxItem>
                  )}
                  {hasType("green_area") && (
                    <DropdownMenuCheckboxItem checked={showGreenAreas} onCheckedChange={setShowGreenAreas}>
                      Green Areas
                    </DropdownMenuCheckboxItem>
                  )}
                  {hasType("recreational_zone") && (
                    <DropdownMenuCheckboxItem
                      checked={showRecreationalZones}
                      onCheckedChange={setShowRecreationalZones}
                    >
                      Recreational Zones
                    </DropdownMenuCheckboxItem>
                  )}
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

            {mode === "edit" && (
              <>
                {!editingLocationId && !prefilledName && !isImporting && (
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
                {editLocationIdFromUrl && !editingLocationId && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg border">
                    <p className="text-sm font-medium">Location highlighted in red - Click it to edit</p>
                  </div>
                )}

                {isImporting && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg border">
                    <p className="text-sm font-medium">
                      Previewing {previewFeatures.length} imported feature(s) - Select type and save
                    </p>
                  </div>
                )}
              </>
            )}

            {mode === "view" && selectedLocation && (
              <div className="absolute bottom-20 left-3 right-3 md:left-auto md:right-3 md:w-80">
                <LocationInfoCard location={selectedLocation} onClose={() => setSelectedLocation(null)} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {mode === "edit" && (
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
                  Click on a <strong>blue lot polygon</strong> on the map to edit it. Other object types are filtered
                  out.
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
                  This location will be linked to{" "}
                  <strong>{lots.find((l) => l.id === selectedLotId)?.lot_number}</strong>
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

            {isImporting && (
              <>
                <Alert className="bg-purple-50 border-purple-200">
                  <AlertCircle className="h-4 w-4 text-purple-600" />
                  <AlertTitle className="text-purple-900">Importing GeoJSON</AlertTitle>
                  <AlertDescription className="text-purple-700">
                    {previewFeatures.length} feature(s) loaded. Select a location type and click "Create Locations" to
                    save them.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="import-type">Location Type for All Features *</Label>
                  <Select value={locationType} onValueChange={(v) => setLocationType(v as any)}>
                    <SelectTrigger id="import-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facility">Facility</SelectItem>
                      <SelectItem value="lot">Lot</SelectItem>
                      <SelectItem value="neighborhood">Neighborhood</SelectItem>
                      <SelectItem value="walking_path">Walking Path</SelectItem>
                      <SelectItem value="boundary">Boundary</SelectItem>
                      <SelectItem value="protection_zone">Protection Zone</SelectItem>
                      <SelectItem value="easement">Easement</SelectItem>
                      <SelectItem value="playground">Playground</SelectItem>
                      <SelectItem value="public_street">Public Street</SelectItem>
                      <SelectItem value="green_area">Green Area</SelectItem>
                      <SelectItem value="recreational_zone">Recreational Zone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood-link-import">Link to Neighborhood (Optional)</Label>
                  <Select value={selectedNeighborhoodId} onValueChange={setSelectedNeighborhoodId}>
                    <SelectTrigger id="neighborhood-link-import">
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

                <div className="space-y-2">
                  <Label htmlFor="lot-link-import">Link to Lot (Optional)</Label>
                  <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                    <SelectTrigger id="lot-link-import">
                      <SelectValue placeholder="Choose a lot..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {lots.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id}>
                          {lot.lot_number} {lot.neighborhoods?.name && `(${lot.neighborhoods.name})`}
                          {lot.address && ` - ${lot.address}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 space-y-2">
                  <Button onClick={handleSaveImport} disabled={saving} className="w-full">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create {previewFeatures.length} Location(s)
                  </Button>
                  <Button variant="outline" onClick={handleCancelImport} className="w-full bg-transparent">
                    Cancel Import
                  </Button>
                </div>
              </>
            )}

            {!isImporting && (
              <>
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
                      <SelectItem value="boundary">Boundary</SelectItem>
                      <SelectItem value="protection_zone">Protection Zone</SelectItem>
                      <SelectItem value="easement">Easement</SelectItem>
                      <SelectItem value="playground">Playground</SelectItem>
                      <SelectItem value="public_street">Public Street</SelectItem>
                      <SelectItem value="green_area">Green Area</SelectItem>
                      <SelectItem value="recreational_zone">Recreational Zone</SelectItem>
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

                {/* Changed to allow linking for all types except lot/neighborhood */}
                {locationType !== "lot" && locationType !== "neighborhood" && neighborhoods.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Link to Neighborhood (Optional)</Label>
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

                {locationType !== "lot" && locationType !== "neighborhood" && lots.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="lot-link">Link to Lot (Optional)</Label>
                    <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                      <SelectTrigger id="lot-link">
                        <SelectValue placeholder="Choose a lot..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
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

                <div className="space-y-2">
                  <Label htmlFor="name">
                    {locationType === "lot"
                      ? "Lot Number"
                      : locationType === "neighborhood"
                        ? "Neighborhood Name"
                        : "Name *"}
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

                    <div className="pt-4 border-t space-y-4">
                      <h3 className="text-sm font-semibold">Facility Details</h3>

                      {/* Capacity and Max Occupancy */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="capacity">Capacity</Label>
                          <Input
                            id="capacity"
                            type="number"
                            min="1"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            placeholder="50"
                          />
                          <p className="text-xs text-muted-foreground">Maximum number of people</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxOccupancy">Max Occupancy</Label>
                          <Input
                            id="maxOccupancy"
                            type="number"
                            min="1"
                            value={maxOccupancy}
                            onChange={(e) => setMaxOccupancy(e.target.value)}
                            placeholder="40"
                          />
                          <p className="text-xs text-muted-foreground">Usually 80% of capacity</p>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="space-y-2">
                        <Label>Amenities</Label>
                        <div className="grid gap-2 sm:grid-cols-2 p-3 border rounded-md max-h-48 overflow-y-auto">
                          {AMENITY_OPTIONS.map((amenity) => (
                            <label key={amenity} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={amenities.includes(amenity)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAmenities([...amenities, amenity])
                                  } else {
                                    setAmenities(amenities.filter((a) => a !== amenity))
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span>{amenity}</span>
                            </label>
                          ))}
                        </div>
                        <Input
                          placeholder="Other amenities (comma separated)"
                          value={customAmenities}
                          onChange={(e) => setCustomAmenities(e.target.value)}
                        />
                      </div>

                      {/* Operating Hours */}
                      <div className="space-y-2">
                        <Label htmlFor="hours">Operating Hours</Label>
                        <Textarea
                          id="hours"
                          value={hours}
                          onChange={(e) => setHours(e.target.value)}
                          placeholder="Mon-Fri: 6:00 AM - 10:00 PM&#10;Sat-Sun: 8:00 AM - 8:00 PM"
                          rows={3}
                        />
                      </div>

                      {/* Status */}
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Coming Soon">Coming Soon</SelectItem>
                            <SelectItem value="Temporarily Unavailable">Temporarily Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Parking */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="parkingAvailable"
                            checked={parkingAvailable}
                            onChange={(e) => setParkingAvailable(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="parkingAvailable" className="cursor-pointer">
                            Parking Available
                          </Label>
                        </div>
                        {parkingAvailable && (
                          <Input
                            type="number"
                            min="1"
                            placeholder="Number of spaces"
                            value={parkingSpaces}
                            onChange={(e) => setParkingSpaces(e.target.value)}
                          />
                        )}
                      </div>

                      {/* Accessibility */}
                      <div className="space-y-2">
                        <Label>Accessibility Features</Label>
                        <div className="grid gap-2 sm:grid-cols-2 p-3 border rounded-md">
                          {ACCESSIBILITY_OPTIONS.map((feature) => (
                            <label key={feature} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={accessibilityFeatures.includes(feature)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAccessibilityFeatures([...accessibilityFeatures, feature])
                                  } else {
                                    setAccessibilityFeatures(accessibilityFeatures.filter((f) => f !== feature))
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span>{feature}</span>
                            </label>
                          ))}
                        </div>
                        <Textarea
                          placeholder="Additional accessibility notes..."
                          value={accessibilityNotes}
                          onChange={(e) => setAccessibilityNotes(e.target.value)}
                          rows={2}
                        />
                      </div>

                      {/* Rules */}
                      <div className="space-y-2">
                        <Label htmlFor="rules">Facility Rules & Guidelines</Label>
                        <RichTextEditor
                          value={rules}
                          onChange={setRules}
                          placeholder="Enter facility rules and guidelines..."
                        />
                      </div>
                    </div>
                  </>
                )}

                {locationType === "walking_path" && (
                  <div className="pt-4 border-t space-y-4">
                    <h3 className="text-sm font-semibold">Path Details</h3>

                    {/* Difficulty */}
                    <div className="space-y-2">
                      <Label htmlFor="pathDifficulty">Difficulty Level</Label>
                      <Select id="pathDifficulty" value={pathDifficulty} onValueChange={setPathDifficulty}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Difficult">Difficult</SelectItem>
                          <SelectItem value="Expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Surface */}
                    <div className="space-y-2">
                      <Label htmlFor="pathSurface">Surface Type</Label>
                      <Select id="pathSurface" value={pathSurface} onValueChange={setPathSurface}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select surface type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paved">Paved</SelectItem>
                          <SelectItem value="Gravel">Gravel</SelectItem>
                          <SelectItem value="Dirt">Dirt/Earth</SelectItem>
                          <SelectItem value="Mixed">Mixed Surface</SelectItem>
                          <SelectItem value="Boardwalk">Boardwalk</SelectItem>
                          <SelectItem value="Rocky">Rocky</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Path Length */}
                    <div className="space-y-2">
                      <Label htmlFor="pathLength">Path Length</Label>
                      <div className="flex gap-2">
                        <Input
                          id="pathLength"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="2.5"
                          value={pathLength}
                          onChange={(e) => setPathLength(e.target.value)}
                          className="flex-1"
                        />
                        <Select value={pathLengthUnit} onValueChange={setPathLengthUnit}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="km">km</SelectItem>
                            <SelectItem value="mi">miles</SelectItem>
                            <SelectItem value="m">meters</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Elevation Gain */}
                    <div className="space-y-2">
                      <Label htmlFor="elevationGain">Elevation Gain</Label>
                      <div className="flex gap-2">
                        <Input
                          id="elevationGain"
                          type="number"
                          min="0"
                          placeholder="150"
                          value={elevationGain}
                          onChange={(e) => setElevationGain(e.target.value)}
                          className="flex-1"
                        />
                        <Select value={elevationUnit} onValueChange={setElevationUnit}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="m">meters</SelectItem>
                            <SelectItem value="ft">feet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="pathStatus">Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger id="pathStatus">
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <PhotoManager
                    photos={uploadedPhotos}
                    heroPhoto={heroPhoto}
                    onPhotosChange={setUploadedPhotos}
                    onHeroPhotoChange={setHeroPhoto}
                    maxPhotos={20}
                    entityType="location"
                  />
                </div>
              </>
            )}

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
      )}
    </div>
  )
}
