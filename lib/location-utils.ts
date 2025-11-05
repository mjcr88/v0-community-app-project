import { createBrowserClient } from "@/lib/supabase/client"

interface CreateLocationParams {
  tenant_id: string
  name: string
  type: string
  description?: string | null
  coordinates?: { lat: number; lng: number } | null
  path_coordinates?: number[][] | null
  boundary_coordinates?: number[][] | null
}

interface OperationResult {
  success: boolean
  error?: string
}

export async function createLocation(params: CreateLocationParams): Promise<OperationResult> {
  try {
    const supabase = createBrowserClient()

    const { error } = await supabase.from("locations").insert(params)

    if (error) {
      console.error("[v0] Location insert error:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error creating location:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function updateTenantBoundary(
  tenantId: string,
  boundaryCoordinates: number[][],
): Promise<OperationResult> {
  try {
    const supabase = createBrowserClient()

    console.log("[v0] Updating tenant boundary for tenant:", tenantId)
    console.log("[v0] Boundary coordinates count:", boundaryCoordinates.length)
    console.log("[v0] First coordinate:", boundaryCoordinates[0])

    // Convert to lat/lng format for tenant record
    const boundaryLatLng = boundaryCoordinates.map((coord) => ({
      lat: coord[0],
      lng: coord[1],
    }))

    console.log("[v0] Converted to lat/lng format, first item:", boundaryLatLng[0])

    const { data, error } = await supabase
      .from("tenants")
      .update({ map_boundary_coordinates: boundaryLatLng })
      .eq("id", tenantId)
      .select()

    console.log("[v0] Tenant update result:", { data, error })

    if (error) {
      console.error("[v0] Tenant update error:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    console.log("[v0] Tenant boundary updated successfully")
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error updating tenant boundary:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
