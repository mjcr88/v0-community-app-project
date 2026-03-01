import { describe, it, expect } from 'vitest'
import { accessRequestSchema, accessRequestAPISchema } from './access-request-schema'

describe('accessRequestSchema', () => {
    const validInput = {
        email: 'Test@Example.COM',
        first_name: 'John',
        last_name: 'Doe',
        family_name: 'The Doe Family',
        lot_id: '550e8400-e29b-41d4-a716-446655440000',
        in_costa_rica: true,
    }

    it('accepts valid input and normalizes email', () => {
        const result = accessRequestSchema.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.email).toBe('test@example.com')
            expect(result.data.first_name).toBe('John')
        }
    })

    it('trims whitespace from text fields', () => {
        const result = accessRequestSchema.safeParse({
            ...validInput,
            first_name: '  John  ',
            last_name: '  Doe  ',
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.first_name).toBe('John')
            expect(result.data.last_name).toBe('Doe')
        }
    })

    it('rejects missing email', () => {
        const result = accessRequestSchema.safeParse({
            ...validInput,
            email: '',
        })
        expect(result.success).toBe(false)
    })

    it('rejects invalid email format', () => {
        const result = accessRequestSchema.safeParse({
            ...validInput,
            email: 'not-an-email',
        })
        expect(result.success).toBe(false)
    })

    it('rejects missing first_name', () => {
        const result = accessRequestSchema.safeParse({
            ...validInput,
            first_name: '',
        })
        expect(result.success).toBe(false)
    })

    it('rejects missing last_name', () => {
        const result = accessRequestSchema.safeParse({
            ...validInput,
            last_name: '',
        })
        expect(result.success).toBe(false)
    })

    it('accepts empty family_name', () => {
        const result = accessRequestSchema.safeParse({
            ...validInput,
            family_name: '',
        })
        expect(result.success).toBe(true)
    })

    it('accepts missing optional fields', () => {
        const result = accessRequestSchema.safeParse({
            email: 'test@example.com',
            first_name: 'John',
            last_name: 'Doe',
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.in_costa_rica).toBe(false)
        }
    })

    it('rejects invalid lot_id format', () => {
        const result = accessRequestSchema.safeParse({
            ...validInput,
            lot_id: 'not-a-uuid',
        })
        expect(result.success).toBe(false)
    })

    it('accepts empty lot_id', () => {
        const result = accessRequestSchema.safeParse({
            ...validInput,
            lot_id: '',
        })
        expect(result.success).toBe(true)
    })

    it('rejects email longer than 255 characters', () => {
        const result = accessRequestSchema.safeParse({
            ...validInput,
            email: 'a'.repeat(250) + '@b.com',
        })
        expect(result.success).toBe(false)
    })

    it('rejects first_name longer than 100 characters', () => {
        const result = accessRequestSchema.safeParse({
            ...validInput,
            first_name: 'a'.repeat(101),
        })
        expect(result.success).toBe(false)
    })
})

describe('accessRequestAPISchema', () => {
    it('requires tenant_slug', () => {
        const result = accessRequestAPISchema.safeParse({
            email: 'test@example.com',
            first_name: 'John',
            last_name: 'Doe',
        })
        expect(result.success).toBe(false)
    })

    it('accepts valid input with tenant_slug', () => {
        const result = accessRequestAPISchema.safeParse({
            email: 'test@example.com',
            first_name: 'John',
            last_name: 'Doe',
            tenant_slug: 'ecovilla',
        })
        expect(result.success).toBe(true)
    })
})
