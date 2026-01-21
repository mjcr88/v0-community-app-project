# System Learnings & Patterns

> **Truths derived from the Codebase**

## 🛡️ Security Patterns
- **Storage Buckets default to Public**: Supabase storage buckets are public by default in this project. **Action**: Always double-check `public: false` for sensitive data.
- **Views bypass RLS by default**: PostgreSQL views execute with owner privileges unless `WITH (security_invoker = true)` is specified. **Action**: Mandate `security_invoker` for all views.
- **Input Validation Gap**: Server Actions often lack Zod validation. **Action**: New `clean-code` rule to enforce Zod.

## 🏗️ Schema Patterns
- **Strict Tenancy**: usage of `tenant_id` is consistent and good.
- **JSONB Coords**: We store `lat/lng` in JSONB, not PostGIS Geometry type yet.
