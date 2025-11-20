import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify user belongs to this tenant
  const { data: resident } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  if (!resident || resident.tenant_id !== tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: locations, error } = await supabase
    .from("locations")
    .select("*")
    .eq("tenant_id", tenantId)

  if (error) {
    console.error("[v0] Error fetching locations:", error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }

  return NextResponse.json(locations || [])
}
