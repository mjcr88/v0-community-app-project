import { deleteFile } from "@/lib/supabase-storage"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    // Try deleting from photos first, or we could infer from URL?
    // The URLs from Supabase contain the bucket name. `deleteFile` handles this inference!
    await deleteFile(url)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Delete error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete file" }, { status: 500 })
  }
}
