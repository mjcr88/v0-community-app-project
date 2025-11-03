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

    if (
      !userData ||
      (userData.role !== "super_admin" && (!userData.is_tenant_admin || userData.tenant_id !== tenantId))
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update tenant boundary
    const { error } = await supabase.from("tenants").update({ map_boundary_coordinates: boundary }).eq("id", tenantId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating community boundary:", error)
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
