# Project History

## Timeline

### January 2026
- **2026-01-20**: **Alpha Cohort Reliability (COMAPP-26)**
    - Implemented "Living Glow" occupancy indicators.
    - Enhanced map readability (Dark Gray labels).
    - Fixed critical flows: Notifications, PWA icons, Date pickers.
- **2026-01-18**: **Admin Flow & Determinism**
    - Refined Admin Resident Flow and "Smart Resident Status".
    - **Security**: Hardened RLS with `SECURITY DEFINER` and explicit `search_path`.
    - **Fix**: Resolved Neighborhood RLS recursion loops.
    - **Fix**: Reverted user ID merge logic to "Update" strategy to preserve foreign keys.
- **2026-01-16**: **Alpha Logic & UI Polish**
    - **Consolidation**: Merged Analytics (PostHog), Security fixes, and Household Items category.
    - **Security**: Critical Next.js and `undici` updates for CVE-2025-55182.
    - **UX**: Removed old onboarding flow; improved Invite Page split layout.
    - **Map**: Restored Map Sidebar functionality for lot residents.
- **2026-01-12**: **Units 4, 5, & 6 Complete**
    - **Exchange**: Full marketplace (Buy/Sell/Free) + Transactions.
    - **Reservations**: Facility management + Booking logic.
    - **Events**: Recurring event series + "This Event Only" vs "Future Events" RSVP logic.
- **2026-01-10**: **Alpha Launch (Units 0-3, 9-10)**
    - **i18n**: Infrastructure for EN/ES.
    - **Documents**: Supabase Storage + TipTap editor for official docs.
    - **Family**: "Request App Access" flow for passive members.

### December 2025
- **2025-12-08**: Security patching (Next.js/React).
- **2025-12-05**: **Mobile Optimization**
    - End-to-end mobile layout fixes.
    - Integration with UserJot for tours.
    - Profile onboarding flow.

### November 2025 (Legacy Versions)
- **2025-11-18**: **v12 Branch (merged)**
    - Finalized request forms, admin moderation, and announcements.
- **2025-11-15**: **v10 Branch (merged)**
    - Sprint 6: Exchange listings management & dashboard performance.
- **2025-11-14**: **v09 Branch (Check-ins)**
    - Check-in feature implementation.
- **2025-11-13**: **v08 Branch (merged)**
    - Completed Event feature scopes across v06, v07, v08.
- **2025-11-10**: **v06 Branch (Events)**
    - Initial event structure, RLS, admin categorization.
- **2025-11-09**: **v05 Branch (Maps & Families)**
    - Resident/Community maps, image uploads, detail pages.
- **2025-11-05**: **v04 Branch (Admin Map)**
    - Admin map viewer & editor, GeoJSON import.
- **2025-11-03**: **v03 Branch (Tenant Admin)**
    - Drawing tools, coordinate assignment, community outlines.
- **2025-11-02**: **v02 Branch (MVP)**
    - User login, permissions, onboarding, community directory.

### November 2025 (Refactors)
- **2025-11-29**: **Mapbox Migration**
    - Full migration from Google Maps to Mapbox.
    - Complete redesign of user-facing screens.
- **2025-11-23**: **Dashboard Redesign (WP4)**
    - Priority Feed logic implementation.
    - Stat card customization.
- **2025-11-20**: **WP3 Design & WP1 Tech Debt**
    - **WP3**: Design tokens, Login page polish, Navigation refactor.
    - **WP1**: Tech Debt Elimination (API v1, Middleware, Rate Limiting, Zod Validation).
- **2025-11-18**: **Announcements System (Phase 1-3)**
    - Hybrid announcements (Admin + Resident scope).
    - "Official" vs "Community" distinction.
    - Auto-archiving implementation.
- **2025-11-17**: **Resident Requests System**
    - Full Request Management (Maintenance, Safety).
    - Admin moderation dashboard.
- **2025-11-15**: **Sprint 6 (Exchange)**
    - CRUD for exchange listings.
    - Lazy loading for dashboard widgets (performance).
