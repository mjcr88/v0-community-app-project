"use client"

import { X, MapPin, Home, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

interface LocationInfoCardProps {
  location: {
    id: string
    name: string
    type: "facility" | "lot" | "walking_path" | "neighborhood"
    description?: string | null
    facility_type?: string | null
    icon?: string | null
    photos?: string[] | null
    neighborhood_id?: string | null
    lot_id?: string | null
  }
  onClose: () => void
}

export function LocationInfoCard({ location, onClose }: LocationInfoCardProps) {
  const [neighborhood, setNeighborhood] = useState<{ id: string; name: string } | null>(null)
  const [lot, setLot] = useState<{ id: string; lot_number: string } | null>(null)
  const [residents, setResidents] = useState<Array<{ id: string; first_name: string; last_name: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedData = async () => {
      setLoading(true)
      const supabase = createBrowserClient()

      // Fetch neighborhood if linked
      if (location.neighborhood_id) {
        const { data } = await supabase
          .from("neighborhoods")
          .select("id, name")
          .eq("id", location.neighborhood_id)
          .single()
        if (data) setNeighborhood(data)
      }

      // Fetch lot if linked
      if (location.lot_id) {
        const { data } = await supabase.from("lots").select("id, lot_number").eq("id", location.lot_id).single()
        if (data) setLot(data)
      }

      // Fetch residents if this is a lot location
      if (location.type === "lot" && location.lot_id) {
        const { data } = await supabase
          .from("users")
          .select("id, first_name, last_name")
          .eq("lot_id", location.lot_id)
          .eq("role", "resident")
        if (data) setResidents(data)
      }

      setLoading(false)
    }

    fetchRelatedData()
  }, [location.id, location.neighborhood_id, location.lot_id, location.type])

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "facility":
        return "Facility"
      case "lot":
        return "Lot"
      case "walking_path":
        return "Walking Path"
      case "neighborhood":
        return "Neighborhood"
      default:
        return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "facility":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "lot":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "walking_path":
        return "bg-sky-100 text-sky-800 border-sky-200"
      case "neighborhood":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className="w-80 shadow-xl border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              {location.icon && <span className="text-xl">{location.icon}</span>}
              <span className="truncate">{location.name}</span>
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={getTypeColor(location.type)}>
                {getTypeLabel(location.type)}
              </Badge>
              {location.facility_type && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  {location.facility_type}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {location.description && (
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">{location.description}</p>
          </div>
        )}

        {neighborhood && (
          <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
            <MapPin className="h-4 w-4 text-purple-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-purple-700 font-medium">Neighborhood</p>
              <p className="text-sm text-purple-900 truncate">{neighborhood.name}</p>
            </div>
          </div>
        )}

        {lot && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Home className="h-4 w-4 text-blue-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-blue-700 font-medium">Lot</p>
              <p className="text-sm text-blue-900 truncate">Lot #{lot.lot_number}</p>
            </div>
          </div>
        )}

        {residents.length > 0 && (
          <div className="p-2 bg-green-50 border border-green-200 rounded-lg space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-xs text-green-700 font-medium">Residents ({residents.length})</p>
            </div>
            <div className="pl-6 space-y-0.5">
              {residents.map((resident) => (
                <p key={resident.id} className="text-sm text-green-900">
                  {resident.first_name} {resident.last_name}
                </p>
              ))}
            </div>
          </div>
        )}

        {location.photos && location.photos.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Photos</h4>
            <div className="grid grid-cols-2 gap-2">
              {location.photos.map((photo, index) => (
                <div key={photo} className="aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={photo || "/placeholder.svg"}
                    alt={`${location.name} - Photo ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.open(photo, "_blank")}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {!location.description &&
          (!location.photos || location.photos.length === 0) &&
          !neighborhood &&
          !lot &&
          residents.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No additional information available</p>
          )}
      </CardContent>
    </Card>
  )
}
