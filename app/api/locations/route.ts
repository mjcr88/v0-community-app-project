import { type NextRequest, NextResponse } from "next/server"
import { getLocations } from "@/lib/data/locations"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get("tenantId")

    console.log("[v0] Locations API called with tenantId:", tenantId)

    if (!tenantId) {
      return NextResponse.json({ success: false, error: "Tenant ID is required" }, { status: 400 })
    }

    const locations = await getLocations(tenantId, {
      enrichWithNeighborhood: false,
      enrichWithLot: false,
      enrichWithResidents: false,
      enrichWithFamilies: false,
      enrichWithPets: false,
    })

    console.log("[v0] Locations fetched from getLocations:", locations.length)
    console.log(
      "[v0] Location types:",
      locations.map((l) => l.type),
    )
    console.log("[v0] Locations with coordinates:", locations.filter((l) => l.coordinates).length)
    console.log("[v0] Locations with boundary_coordinates:", locations.filter((l) => l.boundary_coordinates).length)
    console.log("[v0] Locations with path_coordinates:", locations.filter((l) => l.path_coordinates).length)

    return NextResponse.json({
      success: true,
      locations: locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        type: loc.type,
        coordinates: loc.coordinates,
        boundary_coordinates: loc.boundary_coordinates,
        path_coordinates: loc.path_coordinates,
        icon: loc.icon,
        facility_type: loc.facility_type,
      })),
    })
  } catch (error) {
    console.error("[v0] Error in locations API:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch locations" }, { status: 500 })
  }
}
