import { createServerClient } from "@/lib/supabase/server"
import { getLocations } from "@/lib/data/locations"
import { getCheckIns } from "@/lib/data/check-ins"
import dynamic from 'next/dynamic'

import { AdminMapWrapper } from './admin-map-wrapper'

export default async function MapViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ locationId?: string; preview?: string }>
}) {
  const { slug } = await params
  const { locationId } = await searchParams
  const supabase = await createServerClient()

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    return <div>Tenant not found</div>
  }

  // Fetch locations with relations
  const locations = await getLocations(tenant.id)

  // Fetch active check-ins
  const checkIns = await getCheckIns(tenant.id, {
    activeOnly: true,
    enrichWithCreator: true,
    enrichWithLocation: true,
    enrichWithRsvp: true
  })

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <AdminMapWrapper
        locations={locations}
        tenantId={tenant.id}
        tenantSlug={slug}
        checkIns={checkIns}
        mapCenter={tenant.map_center_coordinates as { lat: number; lng: number } | undefined}
        mapZoom={tenant.map_default_zoom || 15}
        highlightLocationId={locationId}
      />
    </div>
  )
}
