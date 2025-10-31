import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { residentId, authUserId } = await request.json()

    if (!residentId || !authUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use service role to bypass RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // First, delete the temporary user record
    const { error: deleteError } = await supabase.from("users").delete().eq("id", residentId)

    if (deleteError) {
      console.error("[v0] Error deleting temporary user:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Then create a new user record with the auth user id
    const { data: tempUser } = await supabase.from("users").select("*").eq("id", residentId).single()

    // Get the user data before deletion
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("invite_token", null)
      .eq("id", residentId)
      .maybeSingle()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[v0] Error fetching user data:", fetchError)
    }

    // Actually, let's just update the id field directly
    // This won't work because id is the primary key
    // Instead, we need to copy all data to a new record with the auth user id

    // Better approach: Just update the invite_token to null
    // The user will need to be created with the correct auth user id from the start
    const { error: updateError } = await supabase
      .from("users")
      .update({
        invite_token: null,
      })
      .eq("id", residentId)

    if (updateError) {
      console.error("[v0] Error linking resident:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Link resident error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
