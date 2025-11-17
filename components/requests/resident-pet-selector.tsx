"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Users, Dog } from 'lucide-react'

type Resident = {
  id: string
  first_name: string
  last_name: string
  profile_picture_url: string | null
  lot_id: string | null
  lots?: { lot_number: string } | null
}

type Pet = {
  id: string
  name: string
  species: string
  breed: string | null
  profile_picture_url: string | null
  family_unit?: { name: string } | null
}

type ResidentPetSelectorProps = {
  tenantId: string
  selectedResidentIds: string[]
  selectedPetIds: string[]
  onResidentsChange: (ids: string[]) => void
  onPetsChange: (ids: string[]) => void
}

export function ResidentPetSelector({
  tenantId,
  selectedResidentIds,
  selectedPetIds,
  onResidentsChange,
  onPetsChange,
}: ResidentPetSelectorProps) {
  const [residents, setResidents] = useState<Resident[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [residentSearch, setResidentSearch] = useState("")
  const [petSearch, setPetSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Fetch residents
        const residentsResponse = await fetch(`/api/residents?tenantId=${tenantId}`)
        const residentsData = await residentsResponse.json()
        
        // Fetch pets
        const petsResponse = await fetch(`/api/pets?tenantId=${tenantId}`)
        const petsData = await petsResponse.json()

        if (residentsData.success) setResidents(residentsData.data || [])
        if (petsData.success) setPets(petsData.data || [])
      } catch (error) {
        console.error("[v0] Error fetching residents/pets:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [tenantId])

  const filteredResidents = residents.filter((r) =>
    `${r.first_name} ${r.last_name}`.toLowerCase().includes(residentSearch.toLowerCase()),
  )

  const filteredPets = pets.filter((p) =>
    p.name.toLowerCase().includes(petSearch.toLowerCase()) ||
    p.species.toLowerCase().includes(petSearch.toLowerCase()) ||
    (p.breed && p.breed.toLowerCase().includes(petSearch.toLowerCase()))
  )

  const handleResidentToggle = (residentId: string) => {
    if (selectedResidentIds.includes(residentId)) {
      onResidentsChange(selectedResidentIds.filter((id) => id !== residentId))
    } else {
      onResidentsChange([...selectedResidentIds, residentId])
    }
  }

  const handlePetToggle = (petId: string) => {
    if (selectedPetIds.includes(petId)) {
      onPetsChange(selectedPetIds.filter((id) => id !== petId))
    } else {
      onPetsChange([...selectedPetIds, petId])
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="residents">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="residents">Residents</TabsTrigger>
            <TabsTrigger value="pets">Pets</TabsTrigger>
          </TabsList>

          <TabsContent value="residents" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search residents..."
                value={residentSearch}
                onChange={(e) => setResidentSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading residents...</p>
            ) : filteredResidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No residents found</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredResidents.map((resident) => (
                  <div key={resident.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`resident-${resident.id}`}
                      checked={selectedResidentIds.includes(resident.id)}
                      onCheckedChange={() => handleResidentToggle(resident.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={resident.profile_picture_url || undefined} />
                      <AvatarFallback>
                        {resident.first_name[0]}
                        {resident.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label htmlFor={`resident-${resident.id}`} className="cursor-pointer font-normal block">
                        {resident.first_name} {resident.last_name}
                      </Label>
                      {resident.lots && (
                        <p className="text-xs text-muted-foreground">Lot {resident.lots.lot_number}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedResidentIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedResidentIds.length} resident{selectedResidentIds.length !== 1 ? "s" : ""} tagged
              </p>
            )}
          </TabsContent>

          <TabsContent value="pets" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search pets..."
                value={petSearch}
                onChange={(e) => setPetSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading pets...</p>
            ) : filteredPets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pets found</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredPets.map((pet) => (
                  <div key={pet.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`pet-${pet.id}`}
                      checked={selectedPetIds.includes(pet.id)}
                      onCheckedChange={() => handlePetToggle(pet.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={pet.profile_picture_url || undefined} />
                      <AvatarFallback>
                        <Dog className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label htmlFor={`pet-${pet.id}`} className="cursor-pointer font-normal block">
                        {pet.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {pet.breed ? `${pet.breed} (${pet.species})` : pet.species}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedPetIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedPetIds.length} pet{selectedPetIds.length !== 1 ? "s" : ""} tagged
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
