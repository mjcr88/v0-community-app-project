"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, MapPin, Search, X } from "lucide-react"
import Link from "next/link"

interface FamilyMember {
  id: string
  first_name: string
  last_name: string
  lots: {
    id: string
    lot_number: string
    neighborhoods: {
      name: string
    }
  } | null
}

interface Family {
  id: string
  name: string
  profile_picture_url: string | null
  primary_contact_id: string | null
  users: FamilyMember[]
  pets: { id: string }[]
}

interface Neighborhood {
  id: string
  name: string
}

interface FamiliesTableProps {
  families: Family[]
  neighborhoods: Neighborhood[]
  tenantSlug: string
  currentUserFamilyId: string | null
}

export function FamiliesTable({ families, neighborhoods, tenantSlug, currentUserFamilyId }: FamiliesTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("all")

  const filteredFamilies = useMemo(() => {
    return families.filter((family) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        searchQuery === "" ||
        family.name.toLowerCase().includes(searchLower) ||
        family.users.some(
          (member) =>
            member.first_name.toLowerCase().includes(searchLower) ||
            member.last_name.toLowerCase().includes(searchLower),
        )

      // Neighborhood filter
      const familyNeighborhood = family.users[0]?.lots?.neighborhoods?.name
      const matchesNeighborhood = neighborhoodFilter === "all" || familyNeighborhood === neighborhoodFilter

      return matchesSearch && matchesNeighborhood
    })
  }, [families, searchQuery, neighborhoodFilter])

  const clearFilters = () => {
    setSearchQuery("")
    setNeighborhoodFilter("all")
  }

  const hasActiveFilters = searchQuery !== "" || neighborhoodFilter !== "all"

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Families</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by family or member name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
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

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredFamilies.length} of {families.length} families
          </div>
        </CardContent>
      </Card>

      {/* Families Grid */}
      {filteredFamilies.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No families found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {hasActiveFilters ? "Try adjusting your filters" : "No families are registered yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFamilies.map((family) => {
            const isCurrentFamily = family.id === currentUserFamilyId
            const initials = family.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)

            const lot = family.users[0]?.lots
            const memberCount = family.users.length
            const petCount = family.pets?.length || 0

            return (
              <Link key={family.id} href={`/t/${tenantSlug}/dashboard/families/${family.id}`}>
                <Card className="h-full hover:bg-accent transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={family.profile_picture_url || undefined} alt={family.name} />
                        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                      </Avatar>

                      <div className="space-y-2 w-full">
                        <div className="flex items-center justify-center gap-2">
                          <h3 className="font-semibold">{family.name}</h3>
                          {isCurrentFamily && (
                            <Badge variant="secondary" className="text-xs">
                              Your Family
                            </Badge>
                          )}
                        </div>

                        {lot && (
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {lot.neighborhoods?.name} - Lot #{lot.lot_number}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {memberCount} {memberCount === 1 ? "member" : "members"}
                            </span>
                          </div>
                          {petCount > 0 && (
                            <div className="flex items-center gap-1">
                              <span>🐾</span>
                              <span>
                                {petCount} {petCount === 1 ? "pet" : "pets"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
