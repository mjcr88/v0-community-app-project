"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { google } from "google-maps"

interface GooglePlacesAutocompleteProps {
  onPlaceSelected: (place: { name: string; lat: number; lng: number; address?: string }) => void
  placeholder?: string
  defaultValue?: string
}

export function GooglePlacesAutocomplete({
  onPlaceSelected,
  placeholder = "Search for a location...",
  defaultValue = "",
}: GooglePlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const predictionsRef = useRef<HTMLDivElement>(null)

  // Initialize Google Places services
  useEffect(() => {
    if (typeof window === "undefined" || !window.google) return

    // Initialize Autocomplete Service
    if (!autocompleteService.current) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService()
    }

    // Initialize Places Service (needs a map element)
    if (!placesService.current) {
      const mapDiv = document.createElement("div")
      const map = new window.google.maps.Map(mapDiv)
      placesService.current = new window.google.maps.places.PlacesService(map)
    }

    console.log("[v0] Google Places Autocomplete services initialized")
  }, [])

  // Handle input change and fetch predictions
  const handleInputChange = useCallback(async (value: string) => {
    setInputValue(value)

    if (!value.trim() || !autocompleteService.current) {
      setPredictions([])
      setShowPredictions(false)
      return
    }

    setIsLoading(true)
    setShowPredictions(true)

    try {
      const result = await new Promise<any>((resolve, reject) => {
        autocompleteService.current?.getPlacePredictions(
          { input: value },
          (predictions, status) => {
            if (status !== window.google.maps.places.PlacesServiceStatus.OK && status !== window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              reject(status)
              return
            }
            resolve({ predictions })
          }
        )
      })

      console.log("[v0] Autocomplete predictions:", result?.predictions?.length || 0)
      setPredictions(result?.predictions || [])
    } catch (error) {
      console.error("[v0] Error fetching predictions:", error)
      setPredictions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle place selection
  const handlePlaceSelect = useCallback(
    (placeId: string, description: string) => {
      if (!placesService.current) {
        console.error("[v0] Places service not initialized")
        return
      }

      console.log("[v0] Place selected from autocomplete:", placeId, description)

      placesService.current.getDetails(
        {
          placeId: placeId,
          fields: ["name", "formatted_address", "geometry.location"],
        },
        (place, status) => {
          console.log("[v0] Place details response - status:", status, "place:", place)

          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const lat = place.geometry?.location?.lat()
            const lng = place.geometry?.location?.lng()
            const name = place.name || description.split(",")[0] || "Custom Location"
            const address = place.formatted_address

            console.log("[v0] Place data extracted:", { name, lat, lng, address })

            if (lat !== undefined && lng !== undefined) {
              setInputValue(name)
              setPredictions([])
              setShowPredictions(false)

              onPlaceSelected({ name, lat, lng, address })
            } else {
              console.error("[v0] Missing coordinates in place details")
            }
          } else {
            console.error("[v0] Failed to get place details:", status)
          }
        },
      )
    },
    [onPlaceSelected],
  )

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        predictionsRef.current &&
        !predictionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => predictions.length > 0 && setShowPredictions(true)}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {showPredictions && predictions.length > 0 && (
        <Card ref={predictionsRef} className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto shadow-lg">
          <div className="py-1">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-muted flex items-start gap-3 transition-colors"
                onClick={() => handlePlaceSelect(prediction.place_id, prediction.description)}
              >
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{prediction.structured_formatting.main_text}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {prediction.structured_formatting.secondary_text}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
