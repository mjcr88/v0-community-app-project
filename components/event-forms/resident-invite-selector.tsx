"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getResidents, getFamilyUnits } from "@/app/actions/neighborhoods"
import { Search, Users } from "lucide-react"

type Resident = {
  id: string
  first_name: string
  last_name: string
  profile_picture_url: string | null
  family_unit_id: string | null
}

type FamilyUnit = {
  id: string
  name: string
  profile_picture_url: string | null
  member_count: number
}

type ResidentInviteSelectorProps = {
  tenantId: string
  selectedResidentIds: string[]
  selectedFamilyIds: string[]
  onResidentsChange: (ids: string[]) => void
  onFamiliesChange: (ids: string[]) => void
}

export function ResidentInviteSelector({
  tenantId,
  selectedResidentIds,
  selectedFamilyIds,
  onResidentsChange,
  onFamiliesChange,
}: ResidentInviteSelectorProps) {
  const [residents, setResidents] = useState<Resident[]>([])
  const [families, setFamilies] = useState<FamilyUnit[]>([])
  const [residentSearch, setResidentSearch] = useState("")
  const [familySearch, setFamilySearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const [residentsResult, familiesResult] = await Promise.all([getResidents(tenantId), getFamilyUnits(tenantId)])
      if (residentsResult.success) setResidents(residentsResult.data)
      if (familiesResult.success) setFamilies(familiesResult.data)
      setIsLoading(false)
    }
    fetchData()
  }, [tenantId])

  const filteredResidents = residents.filter((r) =>
    `${r.first_name} ${r.last_name}`.toLowerCase().includes(residentSearch.toLowerCase()),
  )

  const filteredFamilies = families.filter((f) => f.name.toLowerCase().includes(familySearch.toLowerCase()))

  const handleResidentToggle = (residentId: string) => {
    if (selectedResidentIds.includes(residentId)) {
      onResidentsChange(selectedResidentIds.filter((id) => id !== residentId))
    } else {
      onResidentsChange([...selectedResidentIds, residentId])
    }
  }

  const handleFamilyToggle = (familyId: string) => {
    if (selectedFamilyIds.includes(familyId)) {
      onFamiliesChange(selectedFamilyIds.filter((id) => id !== familyId))
    } else {
      onFamiliesChange([...selectedFamilyIds, familyId])
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="residents">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="residents">Individual Residents</TabsTrigger>
            <TabsTrigger value="families">Families</TabsTrigger>
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
                    <Label htmlFor={`resident-${resident.id}`} className="flex-1 cursor-pointer font-normal">
                      {resident.first_name} {resident.last_name}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {selectedResidentIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedResidentIds.length} resident{selectedResidentIds.length !== 1 ? "s" : ""} invited
              </p>
            )}
          </TabsContent>

          <TabsContent value="families" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search families..."
                value={familySearch}
                onChange={(e) => setFamilySearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading families...</p>
            ) : filteredFamilies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No families found</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredFamilies.map((family) => (
                  <div key={family.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`family-${family.id}`}
                      checked={selectedFamilyIds.includes(family.id)}
                      onCheckedChange={() => handleFamilyToggle(family.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={family.profile_picture_url || undefined} />
                      <AvatarFallback>
                        <Users className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label htmlFor={`family-${family.id}`} className="cursor-pointer font-normal block">
                        {family.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {family.member_count} member{family.member_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedFamilyIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedFamilyIds.length} famil{selectedFamilyIds.length !== 1 ? "ies" : "y"} invited
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
