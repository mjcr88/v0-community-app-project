import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createServerClient()

  // Verify user is authenticated and is a super admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userData?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { tenantId } = await request.json()

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID required" }, { status: 400 })
  }

  const defaultCategories = [
    { name: "Social", description: "Social gatherings and community bonding activities", icon: "🎉" },
    { name: "Maintenance", description: "Property maintenance and improvement activities", icon: "🔧" },
    { name: "Educational", description: "Learning workshops and educational sessions", icon: "📚" },
    { name: "Sports", description: "Sports activities and fitness events", icon: "🏆" },
    { name: "Community Meeting", description: "Official community meetings and discussions", icon: "💬" },
    { name: "Celebration", description: "Special occasions and celebrations", icon: "🎊" },
  ]

  // Check which categories already exist
  const { data: existingCategories } = await supabase.from("event_categories").select("name").eq("tenant_id", tenantId)

  const existingNames = new Set(existingCategories?.map((c) => c.name) || [])

  // Insert only categories that don't exist
  const categoriesToInsert = defaultCategories
    .filter((cat) => !existingNames.has(cat.name))
    .map((cat) => ({
      tenant_id: tenantId,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
    }))

  if (categoriesToInsert.length > 0) {
    const { error } = await supabase.from("event_categories").insert(categoriesToInsert)

    if (error) {
      console.error("[v0] Error seeding categories:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, seeded: categoriesToInsert.length })
}
