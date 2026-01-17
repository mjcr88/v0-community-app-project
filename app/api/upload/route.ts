import { uploadFile } from "@/lib/supabase-storage"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const { validateFileType, validateFileSize, ALLOWED_FILE_TYPES } = await import("@/lib/upload-security")

    // Determine allowed types based on file MIME type category
    // Default to strict image check if unlikely to be a document
    // TODO: Pass type preference from client if needed. For now, we check if it is ANY allowed type.
    const isImage = ALLOWED_FILE_TYPES.image.includes(file.type)
    const isDoc = ALLOWED_FILE_TYPES.document.includes(file.type)

    // For now, most uploads are images. If we support documents later via this generic route, we might need a flag.
    // But safely, we can just check if it matches *any* allowed type.
    const isValidType = isImage || isDoc

    if (!isValidType) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const sizeValidation = validateFileSize(file, maxSize)
    if (!sizeValidation.valid) {
      return NextResponse.json({ error: sizeValidation.error }, { status: 400 })
    }

    // Upload to Supabase Storage
    // Defaulting to "photos" bucket for now as most existing uploads are images
    // We can infer bucket from type or formData later
    const bucket = isDoc ? "documents" : "photos"

    const result = await uploadFile(file, bucket)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 })
  }
}
