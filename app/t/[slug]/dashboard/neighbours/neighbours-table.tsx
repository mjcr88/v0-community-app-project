"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Languages, Lightbulb, Wrench } from "lucide-react"
import Link from "next/link"

interface NeighboursTableProps {
  residents: any[]
  allInterests: any[]
  neighborhoods: any[]
  tenantSlug: string
}

export function NeighboursTable({ residents, allInterests, neighborhoods, tenantSlug }: NeighboursTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("all")
  const [journeyStageFilter, setJourneyStageFilter] = useState<string>("all")
  const [interestFilter, setInterestFilter] = useState<string>("all")
  const [skillFilter, setSkillFilter] = useState<string>("all")
  const [languageFilter, setLanguageFilter] = useState<string>("all")

  // Extract unique values for filters
  const uniqueSkills = useMemo(() => {
    const skills = new Set<string>()
    residents.forEach((resident) => {
      resident.resident_skills?.forEach((skill: any) => {
        skills.add(skill.skill_name)
      })
    })
    return Array.from(skills).sort()
  }, [residents])

  const uniqueLanguages = useMemo(() => {
    const languages = new Set<string>()
    residents.forEach((resident) => {
      resident.languages?.forEach((lang: string) => {
        languages.add(lang)
      })
    })
    return Array.from(languages).sort()
  }, [residents])

  // Filter residents
  const filteredResidents = useMemo(() => {
    return residents.filter((resident) => {
      const privacySettings = resident.resident_privacy_settings?.[0]

      // Search filter (name)
      const fullName = `${resident.first_name || ""} ${resident.last_name || ""}`.toLowerCase()
      const matchesSearch = fullName.includes(searchQuery.toLowerCase())

      // Neighborhood filter
      const neighborhoodName = resident.lots?.neighborhoods?.name
      const matchesNeighborhood =
        neighborhoodFilter === "all" ||
        (privacySettings?.show_neighborhood !== false && neighborhoodName === neighborhoodFilter)

      // Journey stage filter
      const matchesJourneyStage =
        journeyStageFilter === "all" ||
        (privacySettings?.show_journey_stage !== false && resident.journey_stage === journeyStageFilter)

      // Interest filter
      const residentInterestNames =
        resident.resident_interests?.map((ri: any) => ri.interests?.name).filter(Boolean) || []
      const matchesInterest =
        interestFilter === "all" ||
        (privacySettings?.show_interests !== false && residentInterestNames.includes(interestFilter))

      // Skill filter
      const residentSkillNames = resident.resident_skills?.map((rs: any) => rs.skill_name) || []
      const matchesSkill =
        skillFilter === "all" || (privacySettings?.show_skills !== false && residentSkillNames.includes(skillFilter))

      // Language filter
      const matchesLanguage =
        languageFilter === "all" ||
        (privacySettings?.show_languages !== false && resident.languages?.includes(languageFilter))

      return (
        matchesSearch &&
        matchesNeighborhood &&
        matchesJourneyStage &&
        matchesInterest &&
        matchesSkill &&
        matchesLanguage
      )
    })
  }, [residents, searchQuery, neighborhoodFilter, journeyStageFilter, interestFilter, skillFilter, languageFilter])

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return [firstName, lastName]
      .filter(Boolean)
      .map((n) => n![0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Directory</CardTitle>
        <CardDescription>
          {filteredResidents.length} of {residents.length} residents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Neighborhood" />
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

            <Select value={journeyStageFilter} onValueChange={setJourneyStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Journey Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="building">Building</SelectItem>
                <SelectItem value="arriving">Arriving</SelectItem>
                <SelectItem value="integrating">Integrating</SelectItem>
              </SelectContent>
            </Select>

            <Select value={interestFilter} onValueChange={setInterestFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Interest" />
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

            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Skill" />
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

            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {uniqueLanguages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Residents Grid */}
        {filteredResidents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No residents found matching your filters</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResidents.map((resident) => {
              const privacySettings = resident.resident_privacy_settings?.[0]
              const initials = getInitials(resident.first_name, resident.last_name)
              const displayName = `${resident.first_name || ""} ${resident.last_name || ""}`.trim()

              return (
                <Card key={resident.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage
                          src={
                            privacySettings?.show_profile_picture !== false
                              ? resident.profile_picture_url || undefined
                              : undefined
                          }
                          alt={displayName}
                        />
                        <AvatarFallback className="text-lg">{initials || "?"}</AvatarFallback>
                      </Avatar>

                      <div className="space-y-1 w-full">
                        <h3 className="font-semibold text-lg">{displayName}</h3>

                        {privacySettings?.show_neighborhood !== false && resident.lots?.neighborhoods?.name && (
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{resident.lots.neighborhoods.name}</span>
                          </div>
                        )}

                        {privacySettings?.show_journey_stage !== false && resident.journey_stage && (
                          <Badge variant="secondary" className="capitalize">
                            {resident.journey_stage}
                          </Badge>
                        )}
                      </div>

                      {/* Languages */}
                      {privacySettings?.show_languages !== false &&
                        resident.languages &&
                        resident.languages.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Languages className="h-3 w-3" />
                            <span>{resident.languages.slice(0, 2).join(", ")}</span>
                            {resident.languages.length > 2 && <span>+{resident.languages.length - 2}</span>}
                          </div>
                        )}

                      {/* Interests */}
                      {privacySettings?.show_interests !== false &&
                        resident.resident_interests &&
                        resident.resident_interests.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            <Lightbulb className="h-3 w-3 text-muted-foreground" />
                            {resident.resident_interests.slice(0, 3).map((ri: any) => (
                              <Badge key={ri.interests.id} variant="outline" className="text-xs">
                                {ri.interests.name}
                              </Badge>
                            ))}
                            {resident.resident_interests.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{resident.resident_interests.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                      {/* Skills */}
                      {privacySettings?.show_skills !== false &&
                        resident.resident_skills &&
                        resident.resident_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            <Wrench className="h-3 w-3 text-muted-foreground" />
                            {resident.resident_skills.slice(0, 2).map((skill: any, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill.skill_name}
                              </Badge>
                            ))}
                            {resident.resident_skills.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{resident.resident_skills.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                      <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                        <Link href={`/t/${tenantSlug}/dashboard/neighbours/${resident.id}`}>View Profile</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
