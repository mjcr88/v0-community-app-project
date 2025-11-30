"use client"

import dynamic from "next/dynamic"
import { LocationWithRelations } from "@/lib/data/locations"
import { CheckIn } from "@/components/map/types"

const MapboxFullViewer = dynamic(
    () => import("@/components/map/MapboxViewer").then((mod) => mod.MapboxFullViewer),
    {
        loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
        ssr: false,
    }
)

interface RequestLocationMapProps {
    locations: LocationWithRelations[]
    tenantId: string
    tenantSlug: string
    highlightLocationId?: string
    mapCenter?: { lat: number; lng: number } | null
    mapZoom?: number
    minimal?: boolean
    checkIns?: CheckIn[]
    customMarker?: { lat: number; lng: number; label: string } | null
}

export function RequestLocationMap(props: RequestLocationMapProps) {
    return <MapboxFullViewer {...props} mapZoom={16} checkIns={props.checkIns || []} showControls={!props.minimal} enableSelection={false} />
}
