
import { createClient } from "@/lib/supabase/server"
import { sanitizeFilename } from "@/lib/upload-security"
import { v4 as uuidv4 } from "uuid"

/**
 * Upload a file to Supabase Storage
 * @param file File object to upload
 * @param bucket Storage bucket name (default: "photos")
 * @returns Object containing public URL and other metadata
 */
export async function uploadFile(file: File, bucket: "photos" | "documents" = "photos") {
    const supabase = await createClient()

    const filename = sanitizeFilename(file.name)
    const uniqueId = uuidv4()

    // Create a clean path: year/month/uuid-filename
    const date = new Date()
    const path = `${date.getFullYear()}/${date.getMonth() + 1}/${uniqueId}-${filename}`

    const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) {
        console.error(`[Supabase Storage] Upload error to ${bucket}:`, error)
        throw new Error(`Failed to upload to storage: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(data.path)

    return {
        url: publicUrl,
        pathname: data.path, // Matches Vercel Blob's identifier concept
        contentType: file.type
    }
}

/**
 * Delete a file from Supabase Storage
 * @param pathOrUrl Full public URL or storage path
 * @param bucket Storage bucket name (default: "photos")
 */
export async function deleteFile(pathOrUrl: string, bucket: "photos" | "documents" = "photos") {
    const supabase = await createClient()

    // Extract path if it's a full URL
    let path = pathOrUrl
    if (pathOrUrl.startsWith('http')) {
        const url = new URL(pathOrUrl)
        // Supabase public URL format: .../storage/v1/object/public/bucket/path/to/file
        // We need to extract the path after the bucket name
        const pathParts = url.pathname.split(`/public/${bucket}/`)
        if (pathParts.length > 1) {
            path = pathParts[1]
        }
    }

    // Decode URI component in case the path has %20 etc
    path = decodeURIComponent(path)

    const { error } = await supabase
        .storage
        .from(bucket)
        .remove([path])

    if (error) {
        console.error(`[Supabase Storage] Delete error from ${bucket}:`, error)
        throw new Error(`Failed to delete from storage: ${error.message}`)
    }

    return true
}
