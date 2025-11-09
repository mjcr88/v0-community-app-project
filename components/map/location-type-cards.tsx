"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Home, Route, MapIcon, Shield, Scale, Baby, Bold as Road, Trees, Tent } from "lucide-react"

interface LocationTypeCounts {
  facilities: number
  lots: number
  neighborhoods: number
  walkingPaths: number
  protectionZones: number
  easements: number
  playgrounds: number
  publicStreets: number
  greenAreas: number
  recreationalZones: number
}

interface LocationTypeCardsProps {
  counts: LocationTypeCounts
  onCardClick?: (type: string) => void
  clickable?: boolean
}

export function LocationTypeCards({ counts, onCardClick, clickable = false }: LocationTypeCardsProps) {
  const cards = [
    {
      type: "facility",
      title: "Facilities",
      description: "Community amenities and points of interest",
      count: counts.facilities,
      icon: Building2,
    },
    {
      type: "lot",
      title: "Lots",
      description: "Property boundaries and lot markers",
      count: counts.lots,
      icon: Home,
    },
    {
      type: "neighborhood",
      title: "Neighborhoods",
      description: "Neighborhood areas",
      count: counts.neighborhoods,
      icon: MapIcon,
    },
    {
      type: "walking_path",
      title: "Walking Paths",
      description: "Trails and pathways through the community",
      count: counts.walkingPaths,
      icon: Route,
    },
    {
      type: "protection_zone",
      title: "Protection Zones",
      description: "Protected areas",
      count: counts.protectionZones,
      icon: Shield,
    },
    {
      type: "easement",
      title: "Easements",
      description: "Easement areas",
      count: counts.easements,
      icon: Scale,
    },
    {
      type: "playground",
      title: "Playgrounds",
      description: "Play areas",
      count: counts.playgrounds,
      icon: Baby,
    },
    {
      type: "public_street",
      title: "Public Streets",
      description: "Street network",
      count: counts.publicStreets,
      icon: Road,
    },
    {
      type: "green_area",
      title: "Green Areas",
      description: "Green spaces",
      count: counts.greenAreas,
      icon: Trees,
    },
    {
      type: "recreational_zone",
      title: "Recreational Zones",
      description: "Recreation areas",
      count: counts.recreationalZones,
      icon: Tent,
    },
  ]

  const handleCardClick = (type: string) => {
    if (clickable && onCardClick) {
      onCardClick(type)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.type}
            className={clickable ? "cursor-pointer transition-colors hover:bg-muted/50" : ""}
            onClick={() => handleCardClick(card.type)}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{card.title}</CardTitle>
              </div>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.count || 0}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
