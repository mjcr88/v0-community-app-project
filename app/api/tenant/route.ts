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

    const { data: tenant, error } = await supabase.from("tenants").select("id, slug, name").eq("id", tenantId).single()

    if (error) {
      console.error("[v0] Error fetching tenant:", error)
      return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 })
    }

    return NextResponse.json({ success: true, tenant })
  } catch (error) {
    console.error("[v0] Error in tenant API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
