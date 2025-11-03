import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    const { tenantId } = await params
    const supabase = await createServerClient()
    const { boundary } = await request.json()

    // Verify user is tenant admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is tenant admin or super admin
    const { data: userData } = await supabase
      .from("users")
      .select("role, is_tenant_admin, tenant_id")
      .eq("id", user.id)
      .single()

    console.log("[v0] API - User data:", userData)
    console.log("[v0] API - Checking access for tenantId:", tenantId)

    if (!userData) {
      return NextResponse.json({ error: "Forbidden - User not found" }, { status: 403 })
    }

    // Allow access if:
    // 1. User is super_admin, OR
    // 2. User has role tenant_admin and matches the tenant, OR
    // 3. User is a resident with is_tenant_admin flag and matches the tenant
    const isSuperAdmin = userData.role === "super_admin"
    const isTenantAdmin = userData.role === "tenant_admin" && userData.tenant_id === tenantId
    const isResidentAdmin = userData.role === "resident" && userData.is_tenant_admin && userData.tenant_id === tenantId

    if (!isSuperAdmin && !isTenantAdmin && !isResidentAdmin) {
      console.log("[v0] API - Access denied:", { isSuperAdmin, isTenantAdmin, isResidentAdmin })
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    console.log("[v0] API - Access granted, updating boundary")

    // Update tenant boundary
    const { error } = await supabase.from("tenants").update({ map_boundary_coordinates: boundary }).eq("id", tenantId)

    if (error) {
      console.error("[v0] API - Database error:", error)
      throw error
    }

    console.log("[v0] API - Boundary updated successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API - Error updating community boundary:", error)
    return NextResponse.json({ error: "Failed to update boundary" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    const { tenantId } = await params
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("tenants")
      .select("map_boundary_coordinates")
      .eq("id", tenantId)
      .single()

    if (error) throw error

    return NextResponse.json({ boundary: data.map_boundary_coordinates })
  } catch (error) {
    console.error("Error fetching community boundary:", error)
    return NextResponse.json({ error: "Failed to fetch boundary" }, { status: 500 })
  }
}
