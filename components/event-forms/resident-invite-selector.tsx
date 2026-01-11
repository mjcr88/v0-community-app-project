"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getResidents, getFamilyUnits } from "@/app/actions/neighborhoods"
import { getNeighborLists, type NeighborList } from "@/app/actions/neighbor-lists"
import { Search, Users, List } from "lucide-react"

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

// Extended NeighborList to include member_ids which we added to the action return
type ExtendedNeighborList = NeighborList & {
  member_ids?: string[]
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
  const [lists, setLists] = useState<ExtendedNeighborList[]>([])

  const [residentSearch, setResidentSearch] = useState("")
  const [familySearch, setFamilySearch] = useState("")
  const [listSearch, setListSearch] = useState("")

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const [residentsResult, familiesResult, listsResult] = await Promise.all([
        getResidents(tenantId),
        getFamilyUnits(tenantId),
        getNeighborLists(tenantId)
      ])

      if (residentsResult.success) setResidents(residentsResult.data)
      if (familiesResult.success) setFamilies(familiesResult.data)
      if (listsResult.success) setLists(listsResult.data as ExtendedNeighborList[])

      setIsLoading(false)
    }
    fetchData()
  }, [tenantId])

  const filteredResidents = residents.filter((r) =>
    `${r.first_name} ${r.last_name}`.toLowerCase().includes(residentSearch.toLowerCase()),
  )

  const filteredFamilies = families.filter((f) => f.name.toLowerCase().includes(familySearch.toLowerCase()))

  const filteredLists = lists.filter((l) => l.name.toLowerCase().includes(listSearch.toLowerCase()))

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

  const handleListToggle = (list: ExtendedNeighborList) => {
    const memberIds = list.member_ids || []
    if (memberIds.length === 0) return

    const allSelected = memberIds.every(id => selectedResidentIds.includes(id))

    if (allSelected) {
      // Deselect all members of this list
      onResidentsChange(selectedResidentIds.filter(id => !memberIds.includes(id)))
    } else {
      // Select all members of this list (union)
      const newSelection = new Set([...selectedResidentIds, ...memberIds])
      onResidentsChange(Array.from(newSelection))
    }
  }

  const getListSelectionState = (list: ExtendedNeighborList) => {
    const memberIds = list.member_ids || []
    if (memberIds.length === 0) return "unchecked"

    const selectedCount = memberIds.filter(id => selectedResidentIds.includes(id)).length

    if (selectedCount === memberIds.length) return true // Checked
    if (selectedCount > 0) return "indeterminate"
    return false // Unchecked
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="residents">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="residents">Residents</TabsTrigger>
            <TabsTrigger value="families">Families</TabsTrigger>
            <TabsTrigger value="lists">My Lists</TabsTrigger>
          </TabsList>

          {/* Residents Tab */}
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
          </TabsContent>

          {/* Families Tab */}
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
          </TabsContent>

          {/* Lists Tab */}
          <TabsContent value="lists" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search lists..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading lists...</p>
            ) : filteredLists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No lists found</p>
                <p className="text-xs text-muted-foreground mt-1">Create lists in the Directory to quick-select neighbors.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredLists.map((list) => (
                  <div key={list.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`list-${list.id}`}
                      checked={getListSelectionState(list)}
                      onCheckedChange={() => handleListToggle(list)}
                    />
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm">
                      {list.emoji || <List className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`list-${list.id}`} className="cursor-pointer font-normal block">
                        {list.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {list.member_count} member{list.member_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {(selectedResidentIds.length > 0 || selectedFamilyIds.length > 0) && (
            <div className="pt-2 border-t mt-2">
              <p className="text-sm font-medium">Summary:</p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                {selectedResidentIds.length > 0 && <span>{selectedResidentIds.length} resident{selectedResidentIds.length !== 1 ? "s" : ""}</span>}
                {selectedFamilyIds.length > 0 && <span>• {selectedFamilyIds.length} famil{selectedFamilyIds.length !== 1 ? "ies" : "y"}</span>}
              </div>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
