"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"
import Link from "next/link"
import { filterPrivateData } from "@/lib/privacy-utils"

interface NeighboursTableProps {
  residents: any[]
  allInterests: any[]
  neighborhoods: any[]
  tenantSlug: string
  currentUserFamilyId: string | null
}

export function NeighboursTable({
  residents,
  allInterests,
  neighborhoods,
  tenantSlug,
  currentUserFamilyId,
}: NeighboursTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("all")
  const [interestFilter, setInterestFilter] = useState<string>("all")
  const [skillFilter, setSkillFilter] = useState<string>("all")

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

  // Extract unique lots
  const uniqueLots = useMemo(() => {
    const lots = new Set<string>()
    residents.forEach((resident) => {
      if (resident.lots?.lot_number) {
        lots.add(resident.lots.lot_number)
      }
    })
    return Array.from(lots).sort()
  }, [residents])

  // Filter residents
  const filteredResidents = useMemo(() => {
    return residents.filter((resident) => {
      const privacySettings = resident.user_privacy_settings?.[0]
      const isFamily = resident.family_unit_id === currentUserFamilyId

      // Search filter (name)
      const fullName = `${resident.first_name || ""} ${resident.last_name || ""}`.toLowerCase()
      const matchesSearch = fullName.includes(searchQuery.toLowerCase())

      // Neighborhood filter
      const neighborhoodName = resident.lots?.neighborhoods?.name
      const matchesNeighborhood =
        neighborhoodFilter === "all" ||
        ((isFamily || privacySettings?.show_neighborhood !== false) && neighborhoodName === neighborhoodFilter)

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

      return matchesSearch && matchesNeighborhood && matchesInterest && matchesSkill
    })
  }, [residents, searchQuery, neighborhoodFilter, interestFilter, skillFilter, currentUserFamilyId])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Neighborhood Filter */}
          <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Neighborhoods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Neighborhoods</SelectItem>
              {neighborhoods.map((neighborhood) => (
                <SelectItem key={neighborhood.id} value={neighborhood.name}>
                  {neighborhood.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Interest Filter */}
          <Select value={interestFilter} onValueChange={setInterestFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Interests" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Interests</SelectItem>
              {allInterests.map((interest) => (
                <SelectItem key={interest.id} value={interest.name}>
                  {interest.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Skill Filter */}
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Skills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {uniqueSkills.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Neighborhood</TableHead>
              <TableHead>Lot</TableHead>
              <TableHead>Interests</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No residents found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredResidents.map((resident) => {
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
        Showing {filteredResidents.length} of {residents.length} residents
      </div>
    </div>
  )
}
