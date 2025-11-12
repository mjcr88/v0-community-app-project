"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { getNeighborhoods } from "@/app/actions/neighborhoods"
import { Search } from "lucide-react"

type Neighborhood = {
  id: string
  name: string
  description: string | null
}

type NeighborhoodMultiSelectProps = {
  tenantId: string
  selectedNeighborhoodIds: string[]
  onChange: (ids: string[]) => void
}

export function NeighborhoodMultiSelect({ tenantId, selectedNeighborhoodIds, onChange }: NeighborhoodMultiSelectProps) {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchNeighborhoods() {
      setIsLoading(true)
      const result = await getNeighborhoods(tenantId)
      if (result.success) {
        setNeighborhoods(result.data)
      }
      setIsLoading(false)
    }
    fetchNeighborhoods()
  }, [tenantId])

  const filteredNeighborhoods = neighborhoods.filter((n) => n.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleToggle = (neighborhoodId: string) => {
    if (selectedNeighborhoodIds.includes(neighborhoodId)) {
      onChange(selectedNeighborhoodIds.filter((id) => id !== neighborhoodId))
    } else {
      onChange([...selectedNeighborhoodIds, neighborhoodId])
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label>Select Neighborhoods</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search neighborhoods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading neighborhoods...</p>
        ) : filteredNeighborhoods.length === 0 ? (
          <p className="text-sm text-muted-foreground">No neighborhoods found</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {filteredNeighborhoods.map((neighborhood) => (
              <div key={neighborhood.id} className="flex items-start space-x-3">
                <Checkbox
                  id={`neighborhood-${neighborhood.id}`}
                  checked={selectedNeighborhoodIds.includes(neighborhood.id)}
                  onCheckedChange={() => handleToggle(neighborhood.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={`neighborhood-${neighborhood.id}`} className="font-medium cursor-pointer">
                    {neighborhood.name}
                  </Label>
                  {neighborhood.description && (
                    <p className="text-sm text-muted-foreground">{neighborhood.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedNeighborhoodIds.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {selectedNeighborhoodIds.length} neighborhood{selectedNeighborhoodIds.length !== 1 ? "s" : ""} selected
          </p>
        )}
      </CardContent>
    </Card>
  )
}
