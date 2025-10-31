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

    // Link auth user to resident and clear invite token
    const { error: updateError } = await supabase
      .from("residents")
      .update({
        auth_user_id: authUserId,
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
