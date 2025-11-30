import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getLocations } from "@/lib/data/locations"

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

  const locations = await getLocations(tenantId, {
    enrichWithNeighborhood: true,
    enrichWithLot: true,
    enrichWithResidents: true,
  })

  return NextResponse.json(locations)
}
