import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get("tenantId")

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Fetch tenant map center and zoom
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("map_center_coordinates, map_default_zoom, map_boundary_coordinates")
      .eq("id", tenantId)
      .single()

    if (tenantError) {
      console.error("[v0] Error fetching tenant:", tenantError)
      return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 })
    }

    // If tenant has map center, use it
    if (tenant.map_center_coordinates) {
      return NextResponse.json({
        success: true,
        center: tenant.map_center_coordinates,
        zoom: tenant.map_default_zoom || 14,
      })
    }

    // Otherwise, calculate from boundary
    if (tenant.map_boundary_coordinates && Array.isArray(tenant.map_boundary_coordinates)) {
      const coords = tenant.map_boundary_coordinates as Array<{ lat: number; lng: number }>
      const lats = coords.map((c) => c.lat)
      const lngs = coords.map((c) => c.lng)

      // Calculate bounding box center (visual center of the polygon)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)
      const centerLat = (minLat + maxLat) / 2
      const centerLng = (minLng + maxLng) / 2

      return NextResponse.json({
        success: true,
        center: { lat: centerLat, lng: centerLng },
        zoom: tenant.map_default_zoom || 14,
      })
    }

    // Fallback to default Costa Rica coordinates
    return NextResponse.json({
      success: true,
      center: { lat: 9.9567, lng: -84.5333 },
      zoom: 14,
    })
  } catch (error) {
    console.error("[v0] Error in tenant-map-center API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
