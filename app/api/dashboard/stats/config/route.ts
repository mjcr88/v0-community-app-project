import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AVAILABLE_STATS } from "@/lib/dashboard/stats-config"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Parse request body
        const { config } = await request.json()

        // Validate config
        if (!Array.isArray(config) || config.length !== 4) {
            return NextResponse.json(
                { error: "Config must be an array of exactly 4 stat IDs" },
                { status: 400 }
            )
        }

        // Validate all stat IDs exist
        const validStatIds = AVAILABLE_STATS.map(s => s.id)
        const invalidStats = config.filter(id => !validStatIds.includes(id))
        if (invalidStats.length > 0) {
            return NextResponse.json(
                { error: `Invalid stat IDs: ${invalidStats.join(", ")}` },
                { status: 400 }
            )
        }

        // Update user's dashboard_stats_config
        const { error: updateError } = await supabase
            .from("users")
            .update({ dashboard_stats_config: config })
            .eq("id", user.id)

        if (updateError) {
            console.error("Error updating stats config:", updateError)
            return NextResponse.json(
                { error: "Failed to update configuration" },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating dashboard stats config:", error)
        return NextResponse.json(
            { error: "Failed to update stats configuration" },
            { status: 500 }
        )
    }
}
