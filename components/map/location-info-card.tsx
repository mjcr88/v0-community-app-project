"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { X, Home, Users, PawPrint } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface LocationInfoCardProps {
  location: any
  tenantId: string
  onClose: () => void
  minimal?: boolean
}

export function LocationInfoCard({ location, tenantId, onClose, minimal = false }: LocationInfoCardProps) {
  const [loading, setLoading] = useState(true)
  const [residents, setResidents] = useState<any[]>([])
  const [familyUnit, setFamilyUnit] = useState<any>(null)
  const [pets, setPets] = useState<any[]>([])
  const [lot, setLot] = useState<any>(null)

  console.log("[v0] LocationInfoCard rendering for location:", location.name, location.id)
  console.log(
    "[v0] Location data:",
    JSON.stringify({
      type: location.type,
      lot_id: location.lot_id,
      neighborhood_id: location.neighborhood_id,
      hasLotsObject: !!location.lotsObject,
    }),
  )

  console.log(
    "[v0] LocationInfoCard render state:",
    JSON.stringify({
      loading,
      hasResidents: residents.length > 0,
      hasFamilyUnit: !!familyUnit,
      hasPets: pets.length > 0,
      hasNeighborhood: !!location.neighborhood_id,
      hasLot: !!location.lot_id,
    }),
  )

  useEffect(() => {
    console.log("[v0] LocationInfoCard useEffect triggered for location:", location.id)

    async function fetchRelatedData() {
      console.log("[v0] Starting to fetch related data...")
      const supabase = createClient()

      // Check if location already has embedded data
      if (location.lotsObject?.users) {
        console.log("[v0] Using embedded lotsObject data instead of fetching")
        setResidents(location.lotsObject.users)

        if (location.lotsObject.users.length > 0) {
          setFamilyUnit(location.lotsObject.users[0].family_units)
          console.log("[v0] Family unit found in embedded data:", location.lotsObject.users[0].family_units?.name)

          // Collect pets from all users
          const allPets = location.lotsObject.users.flatMap((user: any) => user.pets || [])
          setPets(allPets)
          console.log(
            "[v0] Pets found:",
            allPets.map((p: any) => p.name),
          )
        }

        setLoading(false)
        return
      }

      // Fetch residents if this is a lot
      if (location.type === "lot" && location.lot_id) {
        console.log("[v0] Fetching residents for lot_id:", location.lot_id)

        const { data: residentData, error } = await supabase
          .from("users")
          .select(`
            id,
            first_name,
            last_name,
            profile_picture_url,
            family_units(
              id,
              name,
              description,
              profile_picture_url
            ),
            pets(
              id,
              name,
              species,
              profile_picture_url
            )
          `)
          .eq("lot_id", location.lot_id)
          .eq("tenant_id", tenantId)

        console.log(
          "[v0] Residents query result:",
          JSON.stringify({ count: residentData?.length || 0, error: error?.message || null }),
        )

        if (residentData && residentData.length > 0) {
          console.log(
            "[v0] Residents found:",
            residentData.map((r) => `${r.first_name} ${r.last_name}`),
          )
          setResidents(residentData)

          // Get family unit from first resident
          if (residentData[0].family_units) {
            setFamilyUnit(residentData[0].family_units)
            console.log("[v0] Family unit found:", residentData[0].family_units.name)
          } else {
            console.log("[v0] No family unit found for residents")
          }

          // Collect all pets
          const allPets = residentData.flatMap((r) => r.pets || [])
          setPets(allPets)
          console.log(
            "[v0] Pets found:",
            allPets.map((p) => p.name),
          )
        } else {
          console.log("[v0] No residents found for lot_id:", location.lot_id)
        }

        // Fetch lot details
        const { data: lotData } = await supabase.from("lots").select("*").eq("id", location.lot_id).single()

        if (lotData) {
          setLot(lotData)
        }
      } else {
        console.log("[v0] Skipping residents fetch - not a lot or no lot_id")
      }

      console.log("[v0] Finished fetching related data, loading set to false")
      setLoading(false)
    }

    fetchRelatedData()
  }, [location, tenantId])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }

  const avatarSize = minimal ? "h-8 w-8" : "h-12 w-12"
  const titleSize = minimal ? "text-base" : "text-lg"
  const textSize = minimal ? "text-xs" : "text-sm"
  const spacing = minimal ? "space-y-2" : "space-y-4"
  const padding = minimal ? "p-3" : "p-4"

  return (
    <Card className={`w-80 shadow-lg ${minimal ? "max-h-[400px]" : "max-h-[600px]"} overflow-y-auto`}>
      <CardHeader className={`flex flex-row items-start justify-between ${padding} pb-2`}>
        <CardTitle className={titleSize}>{location.name || location.lotNumber || "Unknown Location"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className={`${padding} pt-2 ${spacing}`}>
        {loading ? (
          <p className={`${textSize} text-muted-foreground`}>Loading information...</p>
        ) : (
          <>
            {/* Lot Information */}
            {location.type === "lot" && (
              <div className="rounded-lg bg-blue-50 p-3">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-medium text-blue-900">Lot</p>
                    <p className={`font-semibold text-blue-600 ${minimal ? "text-sm" : "text-base"}`}>
                      {location.lotNumber || location.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Family Unit */}
            {familyUnit && (
              <div className="rounded-lg bg-amber-50 p-3">
                <div className="flex items-center gap-3">
                  <Avatar className={avatarSize}>
                    <AvatarImage src={familyUnit.profile_picture_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-amber-200 text-amber-900">
                      {familyUnit.name?.[0]?.toUpperCase() || "F"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className={`font-semibold text-amber-900 ${minimal ? "text-sm" : "text-base"}`}>
                      {familyUnit.name}
                    </p>
                    <p className="text-xs text-amber-700">
                      {residents.length} member{residents.length !== 1 ? "s" : ""}
                    </p>
                    <Link href="#" className="text-xs text-amber-600 hover:underline">
                      View family profile →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Family Members */}
            {residents.length > 0 && (
              <div className="rounded-lg bg-green-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <p className={`font-medium text-green-900 ${textSize}`}>Family Members</p>
                </div>
                <div className={minimal ? "space-y-2" : "space-y-3"}>
                  {residents.map((resident) => (
                    <div key={resident.id} className="flex items-center gap-2">
                      <Avatar className={avatarSize}>
                        <AvatarImage src={resident.profile_picture_url || undefined} className="object-cover" />
                        <AvatarFallback className="bg-green-200 text-green-900">
                          {getInitials(resident.first_name, resident.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className={`font-medium text-green-900 ${textSize}`}>
                          {resident.first_name} {resident.last_name}
                        </p>
                        <Link href="#" className="text-xs text-green-600 hover:underline">
                          View profile →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pets */}
            {pets.length > 0 && (
              <div className="rounded-lg bg-pink-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <PawPrint className="h-4 w-4 text-pink-600" />
                  <p className={`font-medium text-pink-900 ${textSize}`}>Family Pets ({pets.length})</p>
                </div>
                <div className={minimal ? "space-y-2" : "space-y-3"}>
                  {pets.map((pet) => (
                    <div key={pet.id} className="flex items-center gap-2">
                      <Avatar className={avatarSize}>
                        <AvatarImage src={pet.profile_picture_url || undefined} className="object-cover" />
                        <AvatarFallback className="bg-pink-200 text-pink-900">
                          {pet.name?.[0]?.toUpperCase() || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className={`font-medium text-pink-900 ${textSize}`}>{pet.name}</p>
                        <p className="text-xs text-pink-700 capitalize">{pet.species}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Information Available */}
            {!familyUnit && residents.length === 0 && pets.length === 0 && location.type === "lot" && (
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className={`text-muted-foreground ${textSize}`}>No additional information available</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
