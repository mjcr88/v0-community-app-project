"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getResidents, getFamilyUnits } from "@/app/actions/neighborhoods"
import { getNeighborLists } from "@/app/actions/neighbor-lists"
import { Search, Users, List, Info } from "lucide-react"

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

type NeighborList = {
  id: string
  name: string
  description: string | null
  members: Array<{
    user_id: string
  }>
}

type ResidentInviteSelectorProps = {
  tenantId: string
  selectedResidentIds: string[]
  selectedFamilyIds: string[]
  onResidentsChange: (ids: string[]) => void
  onFamiliesChange: (ids: string[]) => void
  initialResidents?: Resident[]
  initialFamilies?: FamilyUnit[]
}

export function ResidentInviteSelector({
  tenantId,
  selectedResidentIds,
  selectedFamilyIds,
  onResidentsChange,
  onFamiliesChange,
  initialResidents = [],
  initialFamilies = [],
}: ResidentInviteSelectorProps) {
  const [residents, setResidents] = useState<Resident[]>(initialResidents)
  const [families, setFamilies] = useState<FamilyUnit[]>(initialFamilies)
  const [lists, setLists] = useState<NeighborList[]>([])
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
      if (listsResult && Array.isArray(listsResult.data)) {
        // Transform the list data to match our component type
        const transformedLists = listsResult.data.map((list: any) => ({
          id: list.id,
          name: list.name,
          description: list.description,
          members: list.neighbor_list_members?.map((m: any) => ({ user_id: m.neighbor_id })) || []
        }))
        setLists(transformedLists)
      }
      setIsLoading(false)
    }

    // If we have initial data, we might skip residents/families but we typically still need lists
    // unless lists are passed as props (which they aren't currently).
    // So we fetch data if any part is missing or just fetch everything to be safe and simple.
    // The previous logic skipped if initialResidents existed, but let's just fetch everything 
    // to ensure we get lists too. We can optimize later if needed.
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

  const handleListToggle = (list: NeighborList) => {
    const memberIds = list.members.map(m => m.user_id)

    // Check if all members are currently selected
    const allSelected = memberIds.every(id => selectedResidentIds.includes(id))

    if (allSelected) {
      // Deselect all members of this list
      onResidentsChange(selectedResidentIds.filter(id => !memberIds.includes(id)))
    } else {
      // Select all members of this list (union)
      const newSelected = [...selectedResidentIds]
      memberIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id)
        }
      })
      onResidentsChange(newSelected)
    }
  }

  // Helper to check if a list is fully selected, partially selected, or unselected
  const getListSelectionState = (list: NeighborList) => {
    if (list.members.length === 0) return "none"
    const memberIds = list.members.map(m => m.user_id)
    const selectedCount = memberIds.filter(id => selectedResidentIds.includes(id)).length

    if (selectedCount === list.members.length) return "all"
    if (selectedCount > 0) return "some"
    return "none"
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="residents">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="residents">Residents</TabsTrigger>
            <TabsTrigger value="families">Families</TabsTrigger>
            <TabsTrigger value="lists">Lists</TabsTrigger>
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
              <div className="flex justify-center p-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
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
              <div className="flex justify-center p-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
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
              <div className="flex justify-center p-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : filteredLists.length === 0 ? (
              <div className="text-center py-8">
                <List className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No neighbor lists found</p>
                <p className="text-xs text-muted-foreground mt-1">Create lists in the Neighbors directory</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredLists.map((list) => {
                  const selectionState = getListSelectionState(list)
                  return (
                    <div key={list.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`list-${list.id}`}
                        checked={selectionState === "all"}
                        // Show indeterminate state via opacity or custom style if needed, but standard checkbox doesn't strictly support indeterminate prop via React easily without ref.
                        // For MVP, if "some" are selected, we show unchecked but user can click to select all.
                        // Or we can just use simple toggle logic.
                        onCheckedChange={() => handleListToggle(list)}
                        className={selectionState === "some" ? "opacity-50" : ""}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`list-${list.id}`} className="cursor-pointer font-normal block flex items-center gap-2">
                          <List className="h-4 w-4 text-muted-foreground" />
                          {list.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {list.members.length} members
                          {selectionState === "some" && " (some selected)"}
                          {selectionState === "all" && " (all selected)"}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <Info className="h-4 w-4" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {filteredLists.length > 0 && (
              <p className="text-xs text-muted-foreground italic">
                Selecting a list adds all its members to the "Residents" tab selection.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
