import { z } from 'zod';

// Helper for optional empty string to undefined
const emptyToUndefined = z.literal('').transform(() => undefined);

export const residentSchema = z.object({
    first_name: z.string().min(1, "First name is required").max(100),
    last_name: z.string().min(1, "Last name is required").max(100),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    phone: z.string().max(20).optional().or(z.literal('')),
    bio: z.string().max(500).optional(),
    status: z.enum(['active', 'inactive', 'pending']).optional(),
    role: z.enum(['resident', 'admin', 'super_admin']).optional(),
});

export const eventSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().optional(),
    start_date: z.string().datetime({ message: "Invalid start date format (ISO 8601 required)" }),
    end_date: z.string().datetime({ message: "Invalid end date format (ISO 8601 required)" }),
    location_id: z.string().uuid().optional(),
    category_id: z.string().uuid().optional(),
    is_all_day: z.boolean().optional(),
    recurrence_rule: z.string().optional(),
    visibility_scope: z.enum(['community', 'neighborhood', 'invite_only']).optional(),
});

export const locationSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().optional(),
    type: z.enum(['facility', 'outdoor', 'common_area', 'other']),
    capacity: z.number().int().min(0).optional(),
    is_reservable: z.boolean().optional(),
    operating_hours: z.record(z.any()).optional(),
    rules: z.string().optional(),
});

export const exchangeSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().min(1, "Description is required"),
    listing_type: z.enum(['offer', 'request']),
    category_id: z.string().uuid().optional(),
    price: z.number().min(0).optional(),
    currency: z.string().default('USD'),
    status: z.enum(['active', 'sold', 'archived']).optional(),
});

export const notificationSchema = z.object({
    title: z.string().min(1).max(200),
    message: z.string().min(1),
    type: z.string(),
    recipient_id: z.string().uuid(),
    link: z.string().url().optional(),
});
