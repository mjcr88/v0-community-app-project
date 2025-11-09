"use client"

import { LocationTypeCards } from "@/components/map/location-type-cards"

interface CommunityMapClientProps {
  counts: {
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
}

export function CommunityMapClient({ counts }: CommunityMapClientProps) {
  const handleCardClick = (type: string) => {
    // Scroll to locations table
    const tableElement = document.getElementById("locations-table")
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    // Update URL with type filter
    const url = new URL(window.location.href)
    url.searchParams.set("type", type)
    window.history.pushState({}, "", url.toString())

    // Trigger a custom event that the table can listen to
    window.dispatchEvent(new CustomEvent("filterLocations", { detail: { type } }))
  }

  return <LocationTypeCards counts={counts} clickable={true} onCardClick={handleCardClick} />
}
