/**
 * File upload security utilities
 */

// Allowed file types map
export const ALLOWED_FILE_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
}

/**
 * Validate file type against allowed types
 */
export function validateFileType(file: File | Blob, allowedTypes: string[]): { valid: boolean; error?: string } {
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`
        }
    }
    return { valid: true }
}

/**
 * Validate file size
 */
export function validateFileSize(file: File | Blob, maxSizeInBytes: number): { valid: boolean; error?: string } {
    if (file.size > maxSizeInBytes) {
        const maxSizeMB = (maxSizeInBytes / (1024 * 1024)).toFixed(2)
        return {
            valid: false,
            error: `File too large. Maximum size is ${maxSizeMB}MB`
        }
    }
    return { valid: true }
}

/**
 * Sanitize filename to prevent directory traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
    // Remove path components
    const name = filename.replace(/^.*[\\\/]/, '')

    // Remove non-alphanumeric characters except dots, dashes, and underscores
    return name.replace(/[^a-zA-Z0-9.\-_]/g, '')
}
