"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"
import { filterPrivateData } from "@/lib/privacy-utils"

interface NeighboursTableProps {
  residents: any[]
  allInterests: any[]
  neighborhoods: any[]
  tenantSlug: string
  currentUserFamilyId: string | null
}

type SortField = "name" | "neighborhood" | "lot" | null
type SortDirection = "asc" | "desc"

export function NeighboursTable({
  residents,
  allInterests,
  neighborhoods,
  tenantSlug,
  currentUserFamilyId,
}: NeighboursTableProps) {
  const [nameFilter, setNameFilter] = useState("")
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("all")
  const [lotFilter, setLotFilter] = useState("")
  const [interestFilter, setInterestFilter] = useState<string>("all")
  const [skillFilter, setSkillFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  // Extract unique values for filters
  const uniqueSkills = useMemo(() => {
    const skills = new Set<string>()
    residents.forEach((resident) => {
      resident.user_skills?.forEach((skill: any) => {
        if (skill.skills?.name) {
          skills.add(skill.skills.name)
        }
      })
    })
    return Array.from(skills).sort()
  }, [residents])

  const uniqueLots = useMemo(() => {
    const lots = new Set<string>()
    residents.forEach((resident) => {
      if (resident.lots?.lot_number) {
        lots.add(resident.lots.lot_number)
      }
    })
    return Array.from(lots).sort()
  }, [residents])

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
  }

  // Filter and sort residents
  const filteredAndSortedResidents = useMemo(() => {
    const filtered = residents.filter((resident) => {
      const privacySettings = resident.user_privacy_settings?.[0]
      const isFamily = resident.family_unit_id === currentUserFamilyId

      // Name filter
      const fullName = `${resident.first_name || ""} ${resident.last_name || ""}`.toLowerCase()
      const matchesName = fullName.includes(nameFilter.toLowerCase())

      // Neighborhood filter
      const neighborhoodName = resident.lots?.neighborhoods?.name
      const matchesNeighborhood =
        neighborhoodFilter === "all" ||
        ((isFamily || privacySettings?.show_neighborhood !== false) && neighborhoodName === neighborhoodFilter)

      // Lot filter
      const lotNumber = resident.lots?.lot_number || ""
      const matchesLot = lotNumber.toLowerCase().includes(lotFilter.toLowerCase())

      // Interest filter
      const residentInterestNames = resident.user_interests?.map((ui: any) => ui.interests?.name).filter(Boolean) || []
      const matchesInterest =
        interestFilter === "all" ||
        ((isFamily || privacySettings?.show_interests !== false) && residentInterestNames.includes(interestFilter))

      // Skill filter
      const residentSkillNames = resident.user_skills?.map((us: any) => us.skills?.name).filter(Boolean) || []
      const matchesSkill =
        skillFilter === "all" ||
        ((isFamily || privacySettings?.show_skills !== false) && residentSkillNames.includes(skillFilter))

      return matchesName && matchesNeighborhood && matchesLot && matchesInterest && matchesSkill
    })

    // Sort
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue = ""
        let bValue = ""

        switch (sortField) {
          case "name":
            aValue = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase()
            bValue = `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase()
            break
          case "neighborhood":
            aValue = a.lots?.neighborhoods?.name || ""
            bValue = b.lots?.neighborhoods?.name || ""
            break
          case "lot":
            aValue = a.lots?.lot_number || ""
            bValue = b.lots?.lot_number || ""
            break
        }

        if (sortDirection === "asc") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      })
    }

    return filtered
  }, [
    residents,
    nameFilter,
    neighborhoodFilter,
    lotFilter,
    interestFilter,
    skillFilter,
    currentUserFamilyId,
    sortField,
    sortDirection,
  ])

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("name")} className="h-8 px-2 font-semibold">
                  Name
                  {getSortIcon("name")}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("neighborhood")} className="h-8 px-2 font-semibold">
                  Neighborhood
                  {getSortIcon("neighborhood")}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("lot")} className="h-8 px-2 font-semibold">
                  Lot
                  {getSortIcon("lot")}
                </Button>
              </TableHead>
              <TableHead className="font-semibold">Interests</TableHead>
              <TableHead className="font-semibold">Skills</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
            <TableRow className="bg-muted/50">
              <TableCell>
                <Input
                  placeholder="Filter name..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {neighborhoods.map((neighborhood) => (
                      <SelectItem key={neighborhood.id} value={neighborhood.name}>
                        {neighborhood.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Filter lot..."
                  value={lotFilter}
                  onChange={(e) => setLotFilter(e.target.value)}
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Select value={interestFilter} onValueChange={setInterestFilter}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {allInterests.map((interest) => (
                      <SelectItem key={interest.id} value={interest.name}>
                        {interest.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select value={skillFilter} onValueChange={setSkillFilter}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueSkills.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedResidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No residents found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedResidents.map((resident) => {
                const privacySettings = resident.user_privacy_settings?.[0]
                const isFamily = resident.family_unit_id === currentUserFamilyId
                const filteredData = filterPrivateData(resident, privacySettings, isFamily)

                return (
                  <TableRow key={resident.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {filteredData.profile_picture_url ? (
                            <AvatarImage
                              src={filteredData.profile_picture_url || "/placeholder.svg"}
                              alt={`${filteredData.first_name} ${filteredData.last_name}`}
                            />
                          ) : (
                            <AvatarFallback>
                              {filteredData.first_name?.[0]}
                              {filteredData.last_name?.[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="font-medium">
                          {filteredData.first_name} {filteredData.last_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{resident.lots?.neighborhoods?.name || "Not assigned"}</TableCell>
                    <TableCell>{resident.lots?.lot_number || "Not assigned"}</TableCell>
                    <TableCell>
                      {filteredData.user_interests && filteredData.user_interests.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {filteredData.user_interests.slice(0, 2).map((ui: any) => (
                            <Badge key={ui.interests.id} variant="secondary" className="text-xs">
                              {ui.interests.name}
                            </Badge>
                          ))}
                          {filteredData.user_interests.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{filteredData.user_interests.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {filteredData.user_skills && filteredData.user_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {filteredData.user_skills.slice(0, 2).map((us: any) => (
                            <Badge key={us.skills.id} variant="secondary" className="text-xs">
                              {us.skills.name}
                            </Badge>
                          ))}
                          {filteredData.user_skills.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{filteredData.user_skills.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/t/${tenantSlug}/dashboard/neighbours/${resident.id}`}>View Profile</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedResidents.length} of {residents.length} residents
      </div>
    </div>
  )
}
