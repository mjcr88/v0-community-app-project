# Retroactive Architecture Decision Records (ADRs)

> **Note**: These decisions have been inferred from the repository history (November 2025 - January 2026) to provide context for the current architecture.

## 2026-01-18: Security Definer Hardening
**Context**: Admin policies on neighborhoods were causing database recursion.
**Decision**:
- ALL `SECURITY DEFINER` functions must explicit set `search_path = public, auth, pg_catalog` to prevent search path hijacking.
- Use `SECURITY DEFINER` sparingly to bypass RLS only when strictly necessary (e.g., admin aggregations), otherwise prefer standard RLS.

## 2026-01-10: Supabase Storage Migration
**Context**: Uploads were split between Vercel Blob and other solutions.
**Decision**:
- Standardize on **Supabase Storage** for all user-generated content (Documents, Avatars, Pet Photos).
- **Rationale**: Better integration with RLS policies, centralized cost, and easier management alongside the database.

## 2026-01-10: i18n Architecture
**Context**: Need for English/Spanish support ("Alpha Launch").
**Decision**:
- **Client-Side Handling**: `LanguageProvider` moved to client-side to persist preference in `localStorage` without server round-trips for every string.
- **Library**: Custom `lib/i18n` solution using JSON files rather than a heavy external dependency, to keep bundle size low.

## 2025-11-29: Mapbox Migration
**Context**: Google Maps was proving rigid for the desired custom styling (3D, dark mode, specific lot highlights).
**Decision**:
- **Adopt Mapbox GL JS**: Enables "Premium" aesthetic, dark mode customization, and better performance for 3D rendering.
- **Component**: `MapboxMap` becomes the core mapping component, replacing Google Maps implementations.

## 2025-11-20: WP1 Tech Debt Elimination (API v1)
**Context**: The app was a prototype with inconsistent patterns.
**Decision**:
- **API v1 Standard**: All new endpoints must live under `app/api/v1/` and return standardized JSON envelopes.
- **Middleware Security**: Authentication and Tenant Isolation moved to Middleware (upstream) rather than per-route checks.
- **Zod Validation**: Input validation is mandatory for all mutations using Zod schemas in `lib/validation`.
- **Reasoning**: To prepare for "WP2 Design System" and scale to multiple tenants reliably.

## 2025-11-18: Announcement Scope Model
**Context**: Announcements needed to distinguish between "System/Admin" broadcasts and "Resident" posts.
**Decision**:
- **Hybrid Scope**:
    - `scope = 'official'`: Admin-only, uses TipTap rich text, appears in "Official" section.
    - `scope = 'community'`: Resident-accessible (future), simpler text, appears in feeds.
