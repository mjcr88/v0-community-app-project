import { z } from 'zod'

/**
 * Shared validation schema for access requests.
 * Used by both frontend (client-side validation) and backend (API route).
 * Per lessons_learned.md: identical frontend/backend constraints.
 */
export const accessRequestSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .max(255, 'Email must be less than 255 characters')
        .transform((val) => val.toLowerCase().trim()),
    first_name: z
        .string()
        .min(1, 'First name is required')
        .max(100, 'First name must be less than 100 characters')
        .transform((val) => val.trim()),
    last_name: z
        .string()
        .min(1, 'Last name is required')
        .max(100, 'Last name must be less than 100 characters')
        .transform((val) => val.trim()),
    family_name: z
        .string()
        .max(100, 'Family name must be less than 100 characters')
        .transform((val) => val.trim())
        .optional()
        .or(z.literal('')),
    lot_id: z
        .string()
        .uuid('Invalid lot selection')
        .optional()
        .or(z.literal('')),
    in_costa_rica: z.boolean().default(false),
})

export type AccessRequestInput = z.input<typeof accessRequestSchema>
export type AccessRequestParsed = z.output<typeof accessRequestSchema>

/**
 * Schema for the API route, which also requires tenant_slug.
 */
export const accessRequestAPISchema = accessRequestSchema.extend({
    tenant_slug: z.string().min(1, 'Tenant slug is required'),
})

export type AccessRequestAPIInput = z.input<typeof accessRequestAPISchema>
