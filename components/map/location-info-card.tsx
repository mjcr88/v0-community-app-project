"use client"

import { X, MapPin, Home, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

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

interface Resident {
  id: string
  first_name: string
  last_name: string
  profile_picture_url?: string | null
  family_unit_id?: string
  family_units?: FamilyUnit[]
}

interface FamilyUnit {
  id: string
  name: string
  profile_picture_url?: string | null
}

interface Pet {
  id: string
  name: string
  species: string
  breed?: string | null
  profile_picture_url?: string | null
}

export function LocationInfoCard({ location, onClose }: LocationInfoCardProps) {
  const [neighborhood, setNeighborhood] = useState<{ id: string; name: string } | null>(null)
  const [lot, setLot] = useState<{ id: string; lot_number: string } | null>(null)
  const [residents, setResidents] = useState<Resident[]>([])
  const [familyUnit, setFamilyUnit] = useState<FamilyUnit | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [tenantSlug, setTenantSlug] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedData = async () => {
      setLoading(true)
      const supabase = createBrowserClient()

      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        const { data: user } = await supabase.from("users").select("tenant_id").eq("id", userData.user.id).single()
        if (user?.tenant_id) {
          const { data: tenant } = await supabase.from("tenants").select("slug").eq("id", user.tenant_id).single()
          if (tenant) setTenantSlug(tenant.slug)
        }
      }

      if (location.neighborhood_id) {
        const { data } = await supabase
          .from("neighborhoods")
          .select("id, name")
          .eq("id", location.neighborhood_id)
          .single()
        if (data) setNeighborhood(data)
      }

      if (location.lot_id) {
        const { data } = await supabase.from("lots").select("id, lot_number").eq("id", location.lot_id).single()
        if (data) setLot(data)
      }

      if (location.type === "lot" && location.lot_id) {
        const { data } = await supabase
          .from("users")
          .select(
            "id, first_name, last_name, profile_picture_url, family_unit_id, family_units(id, name, profile_picture_url)",
          )
          .eq("lot_id", location.lot_id)
          .eq("role", "resident")

        if (data) {
          setResidents(data)
          const family = data.find((resident: any) => resident.family_units)?.family_units
          if (family) {
            setFamilyUnit(family)

            const { data: petsData } = await supabase
              .from("pets")
              .select("id, name, species, breed, profile_picture_url")
              .eq("family_unit_id", family.id)

            if (petsData) setPets(petsData)
          }
        }
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

        {familyUnit && (
          <Link
            href={`/t/${tenantSlug}/dashboard/families/${familyUnit.id}`}
            className="block p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 hover:border-amber-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={familyUnit.profile_picture_url || undefined} alt={familyUnit.name} />
                <AvatarFallback className="bg-amber-200 text-amber-900 text-sm font-semibold">
                  {familyUnit.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900 truncate">{familyUnit.name}</p>
                <p className="text-xs text-amber-700">
                  {residents.length} member{residents.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-amber-600 mt-1">View family profile →</p>
              </div>
            </div>
          </Link>
        )}

        {pets.length > 0 && (
          <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🐾</span>
              <p className="text-xs text-pink-700 font-medium">Family Pets ({pets.length})</p>
            </div>
            <div className="space-y-2">
              {pets.map((pet) => {
                const petInitials = pet.name
                  .split(" ")
                  .map((word: string) => word[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <div key={pet.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-pink-200">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={pet.profile_picture_url || "/placeholder.svg"} alt={pet.name} />
                      <AvatarFallback className="bg-pink-100 text-pink-700 text-xs">{petInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{pet.name}</p>
                      <p className="text-xs text-gray-500 truncate">{pet.species}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {residents.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-xs text-green-700 font-medium">
                {familyUnit ? "Family Members" : `Residents (${residents.length})`}
              </p>
            </div>
            <div className="space-y-2">
              {residents.map((resident) => (
                <Link
                  key={resident.id}
                  href={`/t/${tenantSlug}/dashboard/neighbours/${resident.id}`}
                  className="flex items-center gap-3 p-2 bg-white rounded-lg border border-green-200 hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={resident.profile_picture_url || undefined} alt={resident.first_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {resident.first_name?.[0]}
                      {resident.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {resident.first_name} {resident.last_name}
                    </p>
                    <p className="text-xs text-gray-500">View profile →</p>
                  </div>
                </Link>
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

        {!loading &&
          !location.description &&
          (!location.photos || location.photos.length === 0) &&
          !neighborhood &&
          !lot &&
          residents.length === 0 &&
          pets.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No additional information available</p>
          )}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
