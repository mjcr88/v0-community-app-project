import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * API route to seed default exchange categories when exchange feature is enabled
 */
export async function POST(request: Request) {
  try {
    const { tenantId } = await request.json()

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Default exchange categories
    const defaultCategories = [
      {
        name: "Tools & Equipment",
        description: "Share ladders, drills, garden tools, and other equipment",
      },
      {
        name: "Food & Produce",
        description: "Share homegrown fruits, vegetables, baked goods, and meals",
      },
      {
        name: "Services & Skills",
        description: "Offer tutoring, repairs, pet sitting, and other services",
      },
      {
        name: "Rides & Carpooling",
        description: "Share rides to events, errands, or regular commutes",
      },
      {
        name: "House sitting & Rentals",
        description: "Offer house sitting, vacation rentals, or temporary stays",
      },
    ]

    // Check which categories already exist
    const { data: existingCategories } = await supabase
      .from("exchange_categories")
      .select("name")
      .eq("tenant_id", tenantId)

    const existingNames = new Set(existingCategories?.map((c) => c.name) || [])

    // Insert only categories that don't exist
    const categoriesToInsert = defaultCategories
      .filter((cat) => !existingNames.has(cat.name))
      .map((cat) => ({
        tenant_id: tenantId,
        name: cat.name,
        description: cat.description,
      }))

    if (categoriesToInsert.length > 0) {
      const { error } = await supabase.from("exchange_categories").insert(categoriesToInsert)

      if (error) {
        console.error("[v0] Error seeding exchange categories:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ seeded: categoriesToInsert.length })
  } catch (error) {
    console.error("[v0] Error in seed-exchange-categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
