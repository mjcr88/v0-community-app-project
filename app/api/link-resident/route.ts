import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { residentId, authUserId } = await request.json()

    console.log("[v0] Link resident request:", { residentId, authUserId })

    if (!residentId || !authUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 1. Verify the caller is authenticated
    const { createClient: createAuthClient } = await import("@/lib/supabase/server")
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Allow user to only link themselves
    if (user.id !== authUserId) {
      return NextResponse.json({ error: "Forbidden: You can only link your own account" }, { status: 403 })
    }

    // Use service role to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY_DEV

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: oldResident, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", residentId)
      .single()

    console.log("[v0] Old resident data:", { oldResident, fetchError })

    if (fetchError || !oldResident) {
      console.error("[v0] Error fetching old resident:", fetchError)
      return NextResponse.json({ error: "Resident not found" }, { status: 404 })
    }

    const { error: deleteError } = await supabase.from("users").delete().eq("id", residentId)

    console.log("[v0] Delete result:", { deleteError })

    if (deleteError) {
      console.error("[v0] Error deleting old resident:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const { error: insertError } = await supabase.from("users").insert({
      ...oldResident,
      id: authUserId, // Use the auth user's ID as the new primary key
      invite_token: null, // Clear the invite token
    })

    console.log("[v0] Insert result:", { insertError })

    if (insertError) {
      console.error("[v0] Error inserting new resident:", insertError)
      // Try to restore the old record if insert fails
      await supabase.from("users").insert(oldResident)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log("[v0] Successfully linked resident to auth user")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Link resident error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
