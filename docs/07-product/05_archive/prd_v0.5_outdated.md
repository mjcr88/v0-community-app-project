# Ecovilla Community Platform - Project Onboarding & PRD

**Version**: 1.0  
**Created**: November 2024  
**Last Updated**: November 19, 2024  
**Project Status**: MVP Complete → Alpha Preparation  
**Target**: 6-Week Sprint to Alpha Launch

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Context](#business-context)
3. [Product Overview](#product-overview)
4. [Technical Architecture](#technical-architecture)
5. [Current State Assessment](#current-state-assessment)
6. [Work Package Overview](#work-package-overview)
7. [Testing & Launch Strategy](#testing-launch-strategy)
8. [Development Workflow](#development-workflow)
9. [Critical Implementation Details](#critical-implementation-details)
10. [Success Metrics](#success-metrics)

---

## Executive Summary

### The Opportunity

You are working on a **multi-tenant SaaS community management platform** designed for intentional communities, eco-villages, HOAs, co-housing, and planned developments. The MVP is functionally complete with **61 screens** built using Vercel's v0, Next.js 16, Supabase, and modern web technologies.

### The Founder

- **Non-technical founder** with 15 years of experience in IT project management, product management, consulting, and software sales engineering
- Moving to Ecovilla San Mateo in Costa Rica with family
- Has immediate access to **20-30 alpha testers** (actual residents)
- Bootstrap approach: Solo founder using AI tools ($100-200/month budget)
- **New baby on the way** - working 10-15 hours/week
- No immediate technical co-founder plans

### The Challenge

Transform a functional MVP into a **commercial-ready, delightful product** in 6 weeks:
- **Technical Debt**: Incomplete database migration (49 files), RLS vulnerabilities, performance issues
- **Design**: No design system, basic shadcn components, inconsistent UI
- **Copy**: Placeholder text throughout, no tone of voice
- **Mobile**: Responsive but not optimized for mobile experience
- **Testing**: Need security audit, performance optimization, comprehensive testing

### The Goal

**Alpha Launch in 4-6 weeks** with:
- Zero critical security vulnerabilities
- Professional, delightful user experience
- Mobile-first optimization
- Proper component library and design system
- Performance benchmarks met (Lighthouse 80+)
- 20-30 residents using the platform with proper feedback loops

---

## Business Context

### Vision & Mission

**Vision**: Become the #1 platform for community management in intentional communities and residential developments across the Americas.

**Mission**: Empower communities to thrive through better communication, engagement, and coordination tools.

### Business Model

**Revenue Model**: Usage-based pricing for private communities

**Pricing Strategy** (Early Thinking):
- Property/user-based: ~$3/lot/month or ~$3/resident/month
- Feature-based tiers: Basic, Standard, Premium
- Example: Ecovilla with 300 lots = $900/month potential

**Target Markets**:
1. **Primary**: Eco-villages and intentional communities (250+ in Costa Rica/Central America)
2. **Secondary**: HOAs (30,000+ in North America)
3. **Tertiary**: Co-housing, planned developments, private communities
4. **Future**: HOA management companies (10+ communities per company)

**Geographic Focus**:
- Phase 1: North, Central, and South America
- Phase 2: Global expansion (GDPR compliance required)

### Go-To-Market Strategy

**Phase 1: Proof of Concept** (Now - Month 3)
- Free platform for Ecovilla San Mateo (showcase customer)
- Alpha testing: 20-30 residents
- Beta testing: Scale to 100+ residents
- Document case studies, testimonials, usage metrics

**Phase 2: Early Adopters** (Month 4-6)
- Reach out to 5-10 similar eco-villages in Costa Rica
- Offer discounted pricing ($1-2/lot/month)
- Build initial customer base and refine product

**Phase 3: Paid Launch** (Month 7-12)
- Launch marketing website
- Content marketing (community management best practices)
- Direct outreach to community management companies
- Partnerships with eco-village networks

### Competitive Landscape

**Current Solutions**:
- **Generic**: Facebook Groups, WhatsApp, email lists (free, fragmented, no structure)
- **HOA Software**: Buildium, AppFolio, Caliber (expensive, enterprise-focused, not community-friendly)
- **Community Platforms**: Hivebrite, Mighty Networks (too generic, missing geo-specific features)

**Competitive Advantage**:
- **Community-First Design**: Built specifically for intentional communities
- **Geographic Context**: Native map integration with lot assignments
- **Multi-Tenant**: Single platform, many communities
- **Modern UX**: Mobile-first, delightful, easy to use
- **Affordable**: Pricing accessible to small communities
- **Future AI Integration**: Intelligent assistant, predictive insights

### Data Strategy & Privacy

**Current Approach**:
- Multi-tenant with row-level security (RLS)
- Data residency: Supabase (US-based for now)
- No GDPR required (no EU residents initially)
- Basic privacy settings per user

**Future Approach** (Commercial):
- BYOK (Bring Your Own Keys) option
- Custom Supabase instance per enterprise customer
- Export/delete functionality for compliance
- Enhanced privacy controls

---

## Product Overview

### What Has Been Built

A **comprehensive multi-tenant community management platform** with:

**61 Total Screens Across 3 User Roles:**

#### Super Admin (Backoffice) - 4 Screens
- Dashboard with tenant overview
- Tenants list with management
- Tenant detail/edit forms
- Create new tenant flow

#### Tenant Admin - ~20 Screens
- Admin dashboard with stats
- Resident management (list, create, edit, detail)
- Family management (create, edit, assign)
- Map administration (location CRUD, GeoJSON import)
- Content management (interests, skills, categories)
- Event management (if enabled)
- Exchange administration (if enabled)
- Request handling
- Announcement publishing

#### Resident - ~25 Screens
- Dashboard with personalized widgets
- Profile settings (profile, privacy, notifications)
- Neighbor directory (list, detailed profiles)
- Interactive community map
- Events (browse, create, attend, calendar)
- Check-ins (create, view active, map integration)
- Community Exchange (browse, create listings, transactions)
- Request system (create, browse, respond)
- Announcements (view, filter)
- Notifications (real-time, in-app)

#### Onboarding & Auth - 12 Screens
- Welcome flow (7 screens: welcome, profile, family, journey, interests, skills, complete)
- Authentication (login, signup, invite acceptance)
- Password reset flow

### Core Features

**1. Multi-Tenancy Architecture**
- Each community (tenant) is isolated
- Custom branding per tenant (colors, logo, name)
- Tenant-specific configuration (enabled features, privacy levels)
- Proper RLS policies ensuring data isolation

**2. Role-Based Access Control (RBAC)**
- **Super Admin**: Manage all tenants, backoffice operations
- **Tenant Admin**: Manage single community, full control
- **Resident**: Limited to own data + community interaction
- Auth via Supabase Auth with magic links and invites

**3. Interactive Maps**
- Google Maps integration for community visualization
- UTM → WGS84 coordinate transformation
- GeoJSON import for lot boundaries, roads, protected zones
- Location highlighting and search
- "View on Map" functionality from any entity

**4. Events Management**
- Create/edit/delete events
- Calendar view and list view
- RSVP functionality
- Event categories and filtering
- Integration with notifications

**5. Community Exchange**
- Item listings (for sale, for rent, free, wanted)
- Categories and custom fields
- Image uploads via Vercel Blob
- Transaction tracking
- Search and filter

**6. Check-In System**
- Location-based check-ins
- Status updates (traveling, at home, away)
- Duration tracking
- Map visualization of active check-ins
- Privacy controls

**7. Request System**
- Post requests for help
- Browse available requests
- Respond and coordinate
- Status tracking (open, in-progress, completed)

**8. Announcements**
- Admin-published updates
- Priority levels
- Expiration dates
- Push notifications

**9. Real-Time Notifications**
- In-app notification center
- Push notifications (via Supabase Realtime)
- Notification preferences per category
- Mark as read/unread

**10. Neighbor Discovery**
- Directory with search and filters
- Detailed profiles with interests, skills, families
- Privacy-respecting (honor user settings)
- Public vs. private profile views

### Technical Stack

**Frontend**:
- Next.js 16 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Lucide React icons
- Framer Motion (animations)

**Backend & Infrastructure**:
- Supabase (PostgreSQL, Auth, Realtime, Storage)
- Vercel (hosting, serverless functions)
- Vercel Blob (file storage)
- Google Maps API

**Development Tools**:
- Vercel v0 (initial rapid prototyping)
- Cursor AI (code refactoring and migration)
- Claude Projects (architecture and planning)
- CodeRabbit (code quality, not yet integrated)
- GitHub (version control)

**Data Layer**:
- PostgreSQL with advanced features (PostGIS for geo, JSONB for flexibility)
- Row-Level Security (RLS) for multi-tenancy
- Foreign keys with CASCADE for referential integrity
- Indexes on frequently queried columns
- Soft deletes via status columns

---

## Technical Architecture

### Database Schema Overview

**Core Tables**:

1. **tenants** - Multi-tenant foundation
   - id, slug (unique), name, description
   - branding (colors, logo)
   - features (JSONB: enabled modules per tenant)
   - settings (JSONB: configuration)

2. **users** - Unified user table
   - id (UUID, references auth.users)
   - tenant_id (FK to tenants)
   - role (enum: super_admin, tenant_admin, resident)
   - first_name, last_name, email, phone
   - profile_picture_url
   - bio, date_of_birth
   - status (enum: active, inactive, invited, archived)
   - **CRITICAL**: Migration from `residents` table in progress

3. **families** - Household groupings
   - id, tenant_id, name, description
   - primary_resident_id (FK to users)
   - lot_id (FK to locations)

4. **family_members** - Users in families
   - family_id, user_id (composite PK)
   - relationship (enum: parent, child, partner, etc.)

5. **locations** - Geographic entities
   - id, tenant_id, name, type (enum: lot, amenity, landmark, etc.)
   - geometry (PostGIS GEOMETRY)
   - properties (JSONB: flexible metadata)
   - status

6. **events** - Community events
   - id, tenant_id, created_by_user_id
   - title, description, start_time, end_time
   - location_id, max_attendees
   - status, visibility

7. **event_attendees** - RSVP tracking
   - event_id, user_id, status (enum: going, maybe, not_going)

8. **exchange_listings** - Items for exchange
   - id, tenant_id, user_id
   - title, description, category, price
   - type (enum: for_sale, for_rent, free, wanted)
   - status, expiry_date

9. **check_ins** - Location check-ins
   - id, tenant_id, user_id, location_id
   - status (traveling, at_home, away), start_time, end_time
   - notes

10. **requests** - Community help requests
    - id, tenant_id, created_by_user_id
    - title, description, category, urgency
    - status (open, in_progress, completed)

11. **announcements** - Admin broadcasts
    - id, tenant_id, created_by_user_id
    - title, content, priority
    - published_at, expires_at

12. **notifications** - User notifications
    - id, tenant_id, user_id
    - type, entity_type, entity_id
    - content (JSONB), read_at, clicked_at

13. **user_interests** & **user_skills** - User attributes (junction tables)

14. **user_privacy_settings** - Per-user privacy controls

### Row-Level Security (RLS) Strategy

**Tenant Isolation** (Critical):
```sql
-- Example RLS policy
CREATE POLICY "Users can only access own tenant data"
ON events
FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

**Role-Based Policies**:
- Super Admin: Bypass RLS or access all tenants
- Tenant Admin: Full access to own tenant
- Resident: Limited to own data + community-viewable data

**Current RLS Status**:
- ⚠️ **INCOMPLETE**: Some tables missing policies
- ⚠️ **AUDIT REQUIRED**: Need comprehensive security review
- ✅ Basic tenant isolation exists
- ❌ Some edge cases not covered (e.g., cross-tenant queries)

### File Architecture

```
/
├── app/
│   ├── layout.tsx (root layout)
│   ├── page.tsx (landing/auth)
│   ├── api/ (API routes)
│   │   ├── link-resident/
│   │   ├── accept-invite/
│   │   └── ... (various endpoints)
│   ├── backoffice/ (super admin)
│   │   ├── dashboard/
│   │   └── tenants/
│   ├── onboarding/ (resident onboarding flow)
│   │   └── [step]/
│   └── t/[slug]/ (tenant-specific routes)
│       ├── admin/ (tenant admin)
│       │   ├── dashboard/
│       │   ├── residents/
│       │   ├── families/
│       │   ├── map/
│       │   ├── events/
│       │   ├── exchange/
│       │   └── ...
│       └── dashboard/ (resident)
│           ├── page.tsx (dashboard)
│           ├── settings/
│           ├── neighbours/
│           ├── events/
│           ├── exchange/
│           ├── check-ins/
│           └── ...
├── components/
│   ├── ui/ (shadcn base components)
│   ├── maps/ (map components - NEEDS CONSOLIDATION)
│   │   ├── GoogleMapEditor.tsx (primary)
│   │   ├── PigeonMap.tsx (legacy)
│   │   ├── LeafletMap.tsx (legacy)
│   │   └── MapboxMap.tsx (legacy)
│   ├── notifications/ (notification components)
│   ├── forms/ (form components)
│   └── ... (various feature components)
├── lib/
│   ├── supabase/ (Supabase clients)
│   ├── utils/ (utility functions)
│   ├── data/ (data layer - IN PROGRESS)
│   ├── validations/ (Zod schemas)
│   └── constants/
├── hooks/ (custom React hooks)
├── types/ (TypeScript types)
├── public/ (static assets)
└── supabase/ (database migrations, RLS policies)
    └── migrations/
        ├── 001_initial_schema.sql
        ├── 022_users_table_migration.sql
        ├── 023_user_junction_tables.sql
        ├── 024_migrate_data.sql
        └── ... (40+ migration files)
```

### Known Technical Debt

**Priority 1: Critical (Blocks Alpha)**

1. **Incomplete Database Migration** (49 files remaining)
   - Started migrating from `residents` table → `users` table
   - Only 3 files updated so far
   - Must complete before alpha launch
   - Risk: Data inconsistencies, security vulnerabilities

2. **RLS Policy Vulnerabilities**
   - Some tables have incomplete policies
   - Potential cross-tenant data leaks
   - Must audit all 20+ tables
   - Risk: Data breach, compliance issues

3. **Performance Issues**
   - GeoJSON upload freezes on large files (>480KB)
   - No optimization for mobile data usage
   - Some queries lack indexes
   - Risk: Poor user experience, churn

4. **Map Component Consolidation**
   - Multiple map libraries (pigeon-maps, leaflet, mapbox, Google Maps)
   - GoogleMapEditor is primary, others are legacy
   - Causes bundle bloat and confusion
   - Risk: Maintenance nightmare, bugs

**Priority 2: High (Impacts Polish)**

5. **No Design System**
   - Components built ad-hoc
   - Inconsistent spacing, colors, typography
   - No component library or documentation
   - Risk: Unprofessional appearance, slow iteration

6. **Placeholder Copy Throughout**
   - No tone of voice
   - Generic button labels ("Submit", "Cancel")
   - Missing helpful microcopy
   - Risk: Confusing UX, low engagement

7. **Mobile Experience**
   - Responsive but not mobile-optimized
   - No mobile-specific navigation (e.g., bottom tabs)
   - Touch targets too small in places
   - Risk: Mobile users frustrated (majority of users)

8. **No Error Handling**
   - Missing error boundaries
   - No user-friendly error messages
   - No logging/monitoring
   - Risk: Silent failures, frustrated users

**Priority 3: Medium (Post-Alpha)**

9. **No API Architecture**
   - Direct Supabase calls from components
   - No centralized data layer
   - Makes testing difficult
   - Risk: Hard to build AI assistant, maintain

10. **No Automated Testing**
    - Zero unit tests
    - Zero integration tests
    - Manual testing only
    - Risk: Regressions, bugs in production

11. **Accessibility (a11y)**
    - No keyboard navigation testing
    - Missing ARIA labels in places
    - No screen reader testing
    - Risk: Excludes users with disabilities

---

## Current State Assessment

### Code Quality Audit

**Overall Rating: 6.5/10** (Functional MVP, needs refinement)

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Architecture** | 7/10 | Solid multi-tenant foundation, but data layer incomplete |
| **Security** | 6/10 | RLS exists but needs comprehensive audit |
| **Performance** | 5/10 | Works but has bottlenecks (GeoJSON, large queries) |
| **Code Quality** | 6/10 | Readable but inconsistent patterns, needs refactoring |
| **Testing** | 2/10 | Manual only, no automated tests |
| **Documentation** | 3/10 | Minimal, mostly in-code comments |
| **Design** | 5/10 | Functional but not polished, inconsistent |
| **Mobile UX** | 4/10 | Responsive but not optimized |
| **Accessibility** | 4/10 | Basic HTML semantics, needs improvement |
| **Maintainability** | 6/10 | Good structure but tech debt piling up |

### Quick Wins (1-2 days each)

1. **Add Error Boundaries** (4 hours)
   - Wrap major sections in error boundaries
   - User-friendly error messages
   - Automatic error logging

2. **Consolidate Map Components** (8 hours)
   - Remove legacy map libraries
   - Standardize on GoogleMapEditor
   - Reduce bundle size significantly

3. **Add Loading States** (6 hours)
   - Consistent skeleton screens
   - Loading indicators on all async actions
   - Better perceived performance

4. **Input Validation** (6 hours)
   - Add Zod schemas for all forms
   - Client-side + server-side validation
   - Clear error messages

5. **Mobile Touch Targets** (4 hours)
   - Ensure 44px minimum touch targets
   - Add spacing between interactive elements
   - Test on actual devices

### Major Refactoring Efforts (Post-Alpha)

1. **Component Library** (2-3 weeks)
   - Build 20+ reusable components
   - Document with Storybook
   - Replace ad-hoc components across app

2. **Data Layer Abstraction** (2 weeks)
   - Create `/lib/data` directory with modules
   - Abstract all Supabase calls
   - Add caching layer

3. **Testing Suite** (3-4 weeks)
   - Unit tests (Jest + React Testing Library)
   - Integration tests (Playwright)
   - E2E critical paths

4. **API v1 Foundation** (3 weeks)
   - Build REST API (`/api/v1/*`)
   - Authentication via JWT
   - Rate limiting
   - Foundation for AI assistant

---

## Work Package Overview

**Total Timeline**: 6 weeks (10-15 hours/week = 60-90 hours total)

### WP1: Tech Debt Elimination + API Foundation (Week 1)
**Duration**: 5 days (40 hours)  
**Priority**: CRITICAL - Blocks everything else

**Objectives**:
1. Complete Residents→Users migration (49 files)
2. Audit and fix all RLS policies
3. Create centralized data layer (`/lib/data/*`)
4. Build API v1 foundation (`/app/api/v1/*`)
5. Optimize performance (GeoJSON, indexes)
6. Implement security (rate limiting, validation)

**Deliverables**:
- ✅ Zero instances of old `residents` table queries
- ✅ RLS policies secure on all 20+ tables
- ✅ Data layer with 10+ modules
- ✅ API v1 with 10+ endpoints
- ✅ Performance: Lighthouse 80+ mobile score
- ✅ Security: Rate limiting active on all API routes

**Success Criteria**:
- Can proceed to WP2 with confidence
- No known security vulnerabilities
- App loads quickly on mobile
- Admin and resident features all work

---

### WP2: Design System Enhancement (Week 1-2)
**Duration**: 3 days (24 hours)  
**Priority**: HIGH - Enables all UI work

**Objectives**:
1. Refine design specification based on audit
2. Define color system, typography, spacing
3. Document component patterns
4. Create design tokens in code

**Deliverables**:
- ✅ Design specification document (updated)
- ✅ CSS variables for design tokens
- ✅ Typography scale defined
- ✅ Color palette with semantic names
- ✅ Spacing scale (4px base)
- ✅ Shadow, border, radius systems

**Success Criteria**:
- Developers can build new screens without design questions
- Consistent visual language across app
- Design system documented and shared

---

### WP3: Component Library (Week 2)
**Duration**: 5 days (40 hours)  
**Priority**: HIGH - Reduces duplication

**Objectives**:
1. Build 20+ reusable components
2. Integrate shadcn + MagicUI components
3. Document usage patterns
4. Replace ad-hoc components

**Key Components to Build**:
- Layout: `<PageHeader>`, `<PageContainer>`, `<Section>`
- Navigation: `<MobileNav>` (bottom tabs), `<DesktopNav>` (sidebar)
- Data Display: `<ResidentCard>`, `<EventCard>`, `<ListingCard>`, `<EmptyState>`
- Forms: `<FormField>`, `<SearchBar>`, `<FileUpload>`
- Feedback: `<Toast>`, `<ConfirmDialog>`, `<LoadingSpinner>`
- Interactions: `<SwipeableSheet>`, `<PullToRefresh>`

**Deliverables**:
- ✅ Component library at `/components/ecovilla/`
- ✅ Each component documented with examples
- ✅ Storybook (optional) for component showcase

**Success Criteria**:
- Can build any screen with existing components
- No duplicated UI code patterns
- Developers can find and use components easily

---

### WP4: Río Avatar System (Week 2)
**Duration**: 2-3 days (16-24 hours), parallel with WP3  
**Priority**: MEDIUM - High delight factor

**Objectives**:
1. Create Río character (Costa Rican parrot mascot)
2. Design 8 emotional states
3. Integrate into empty states and loading screens
4. Add subtle animations (breathing, blinking)

**Río Emotional States**:
- Welcome/Happy (onboarding, celebrations)
- Encouraging (empty states)
- Searching (search in progress)
- Loading (data fetching)
- Success (goals achieved)
- Sleeping (all caught up)
- Waving (logout)
- Thinking (AI processing)

**Implementation**:
- Use Midjourney/DALL-E for image generation ($20)
- Export as SVG for scalability
- Use Rive for animation (free tier)
- React component: `<RioAvatar state="happy" size="lg" />`

**Deliverables**:
- ✅ Río character SVGs (8 states)
- ✅ Animated versions with Rive
- ✅ React component with props
- ✅ Integrated into 10+ screens

**Success Criteria**:
- Río feels like part of the brand
- Users mention Río in feedback
- Adds personality without being distracting

---

### WP5: Tier 1 Screens (Mobile-First) (Week 3)
**Duration**: 5 days (40 hours)  
**Priority**: HIGH - Critical path screens

**Scope**: 15 most important screens, mobile-optimized

**Screens**:
1. Login / Signup
2. Onboarding (7 screens: welcome, profile, family, journey, interests, skills, complete)
3. Resident Dashboard
4. Community Map (view mode)
5. Profile Settings
6. Check-In Create
7. Event List

**Objectives**:
- Mobile-first design (bottom navigation)
- Proper touch targets (44px min)
- Fast loading (<2s)
- Delightful micro-interactions
- Professional copy

**Deliverables**:
- ✅ All 15 screens redesigned for mobile
- ✅ Bottom navigation implemented
- ✅ Copy rewritten with tone of voice
- ✅ Lighthouse mobile score 80+

**Success Criteria**:
- Alpha testers can complete critical flows on mobile
- No usability complaints on core features
- Feels polished and professional

---

### WP6: Tier 2 Screens (Week 4)
**Duration**: 5 days (40 hours)  
**Priority**: MEDIUM - Secondary features

**Scope**: 20 remaining resident + admin screens

**Screens**:
- Events (detail, create)
- Exchange (browse, detail, create)
- Neighbors (list, detail)
- Requests (list, create)
- Announcements
- Notifications
- Admin screens (residents, families, map)

**Objectives**:
- Apply design system consistently
- Desktop enhancements (where applicable)
- Copy rewrite
- Accessibility improvements

**Deliverables**:
- ✅ 20 screens redesigned
- ✅ Desktop experience improved
- ✅ All copy rewritten
- ✅ WCAG AA compliance (basic)

**Success Criteria**:
- No major UX complaints on any screen
- Admin users can manage community efficiently
- Design feels cohesive across entire app

---

### WP7: Copy & Content (Week 4)
**Duration**: 2-3 days (16-24 hours), parallel with WP6  
**Priority**: MEDIUM - Polish

**Objectives**:
1. Define tone of voice (friendly, community-focused, clear)
2. Rewrite all copy systematically
3. Add helpful microcopy (hints, tooltips)
4. Error messages and empty states

**Approach**:
- Use Claude API to systematically rewrite copy
- Review and approve in batches
- Test with alpha users for clarity

**Deliverables**:
- ✅ Tone of voice guide
- ✅ All UI copy rewritten
- ✅ Empty states have encouraging messages
- ✅ Error messages are helpful, not technical

**Success Criteria**:
- App feels warm and welcoming
- Users understand what to do without help
- Copy is consistent across all screens

---

### WP8: Map Migration (Week 5)
**Duration**: 3-4 days (24-32 hours)  
**Priority**: MEDIUM - Nice to have

**Objectives**:
1. Consolidate on single map library
2. Remove legacy implementations
3. Optimize GeoJSON handling
4. Improve map performance

**Current State**:
- Google Maps (primary)
- pigeon-maps (legacy)
- Leaflet (legacy)
- Mapbox (legacy)

**Deliverables**:
- ✅ Single map implementation (Google Maps)
- ✅ Legacy libraries removed
- ✅ GeoJSON Web Worker for large files
- ✅ Map loads in <2s

**Success Criteria**:
- Smaller bundle size
- No map-related bugs
- GeoJSON imports work smoothly

---

### WP9: Testing & Polish (Week 6)
**Duration**: 5 days (40 hours)  
**Priority**: CRITICAL - Launch readiness

**Objectives**:
1. Comprehensive manual testing
2. Fix critical bugs
3. Performance audit
4. Accessibility audit
5. Documentation
6. Feedback mechanisms

**Testing Checklist**:
- Auth & onboarding flows
- All resident features
- All admin features
- Cross-tenant isolation (security)
- Performance on slow connections
- Mobile devices (iOS, Android)
- Desktop browsers (Chrome, Safari, Firefox)

**Deliverables**:
- ✅ Zero blocking bugs
- ✅ Lighthouse score 80+ on mobile
- ✅ WCAG AA compliance on critical paths
- ✅ Feedback system integrated (in-app button)
- ✅ Getting Started guide written
- ✅ 5-minute walkthrough video recorded

**Success Criteria**:
- Confident to invite first 10 alpha testers
- Clear feedback loop established
- Documentation exists for users

---

### WP10: AI Assistant Foundation (Week 7-8, Post-Alpha)
**Duration**: 2 weeks (60-80 hours)  
**Priority**: LOW - Future feature

**Objectives**:
1. Build API infrastructure for AI
2. Integrate Claude API
3. Create basic Q&A assistant
4. Lay foundation for Telegram integration

**Deliverables**:
- ✅ `/api/v1/ai/query` endpoint
- ✅ Chat UI in resident dashboard
- ✅ Context-aware responses (fetch relevant data)
- ✅ Telegram bot (Phase 1: message storage)

**Success Criteria**:
- Assistant can answer basic community questions
- Responses are accurate and cite sources
- Foundation for future MCP server integration

---

### WP11: Admin Screens (Week 9-10, Post-Beta)
**Duration**: 2 weeks (60-80 hours)  
**Priority**: LOW - Post-beta

**Objectives**:
1. Redesign admin screens for efficiency
2. Mobile-friendly admin experience
3. Bulk operations
4. Advanced management features

**Deliverables**:
- ✅ 20+ admin screens redesigned
- ✅ Bulk operations (invite residents, assign lots)
- ✅ Mobile admin experience

**Success Criteria**:
- Admins can manage 100+ residents efficiently
- Mobile admin experience works well
- Power user features available

---

### WP12: Feature Flags & Analytics (Ongoing)
**Duration**: 1-2 days (8-16 hours)  
**Priority**: MEDIUM - Enables experimentation

**Objectives**:
1. Implement feature flags per tenant
2. Add analytics tracking
3. A/B testing infrastructure

**Approach**:
- Use existing `tenant.features` JSONB column
- Add `beta_features` for experimental features
- PostHog for analytics (free tier: 1M events)

**Deliverables**:
- ✅ Feature flags working (toggle per tenant)
- ✅ Analytics integrated (page views, events)
- ✅ Dashboard to view metrics

**Success Criteria**:
- Can enable/disable features instantly
- Data-driven decisions on feature adoption
- Emergency kill switch available

---

## Testing & Launch Strategy

### Testing Phases

**Phase 1: Alpha Testing (Week 7-10)**

**Participants**: 20-30 Ecovilla San Mateo residents

**Objectives**:
- Validate core functionality
- Identify critical bugs
- Gather initial feedback on UX
- Test onboarding flow with real users

**Approach**:
- **Week 1**: Invite first 10 users (early adopters)
  - Send personalized invites via email/WhatsApp
  - Include getting started guide + video
  - Set up WhatsApp group for feedback
- **Week 2**: Expand to 20 users
  - Monitor usage and engagement
  - Fix critical bugs quickly
  - Weekly feedback sessions (video calls)
- **Week 3-4**: Scale to 30 users
  - Iterate on feedback
  - Test at scale (100+ events, locations)
  - Prepare for beta

**Feedback Mechanisms**:
- In-app feedback button (screenshot + context)
- WhatsApp group for quick questions
- Weekly feedback forms (TypeForm)
- Bi-weekly video calls with active users
- Analytics dashboard (PostHog)

**Success Metrics**:
- 80% of invited users complete onboarding
- 60% weekly active users (WAU)
- <10 critical bugs reported
- Net Promoter Score (NPS) > 40
- Avg session duration > 5 minutes

**Alpha Exit Criteria**:
- All critical bugs fixed
- Core features stable (events, map, check-ins)
- Onboarding completion rate >80%
- Ready to scale to 100 users

---

**Phase 2: Beta Testing (Week 11-18)**

**Participants**: 100+ Ecovilla residents (scaled gradually)

**Objectives**:
- Test at scale
- Validate performance and security
- Refine features based on broader feedback
- Prepare for public launch

**Approach**:
- **Week 1-2**: Scale to 50 users
  - Monitor performance (server load, database queries)
  - Test concurrent usage
  - Optimize bottlenecks
- **Week 3-4**: Scale to 75 users
  - Launch secondary features (exchange, requests)
  - Gather feedback on advanced features
- **Week 5-6**: Scale to 100+ users
  - Full community rollout
  - Test edge cases
  - Prepare marketing materials

**Success Metrics**:
- 70% WAU (weekly active users)
- <5 bugs per week (reported)
- NPS > 50
- Performance: <2s page load, 99.5% uptime
- Retention: 80% of alpha users still active

**Beta Exit Criteria**:
- Performance targets met (Lighthouse 90+)
- Security audit passed (external review)
- Legal/compliance ready (terms, privacy policy)
- Marketing website launched
- Payment integration tested
- Ready for commercial launch

---

**Phase 3: Public Launch (Week 19+)**

**Objectives**:
- Onboard first paying customers
- Expand to 5-10 communities
- Validate business model
- Build case studies

**Launch Checklist**:
- [ ] Marketing website live
- [ ] Payment integration (Stripe)
- [ ] Legal docs (terms, privacy, SLA)
- [ ] Customer support system (Intercom/email)
- [ ] Monitoring + alerting (Sentry, UptimeRobot)
- [ ] Sales collateral (deck, one-pager, case studies)
- [ ] Pricing page public
- [ ] First 5 sales calls scheduled

---

### Test Strategy Details

**Manual Testing Procedures**

**Pre-Alpha Checklist** (Before first testers):

```markdown
## Authentication & User Management
- [ ] Login with email + magic link
- [ ] Signup creates new user
- [ ] Invite flow: Token generation, email send, acceptance
- [ ] Password reset flow works
- [ ] User profile creation during onboarding
- [ ] User can edit profile
- [ ] Profile picture upload works

## Onboarding Flow
- [ ] Welcome screen displays
- [ ] Profile info captures all fields
- [ ] Family linking works (create new, join existing)
- [ ] Journey selection saves
- [ ] Interests selection saves
- [ ] Skills selection saves
- [ ] Completion screen shows
- [ ] User redirected to dashboard after onboarding

## Multi-Tenancy & Security
- [ ] Resident can only see own tenant data
- [ ] Resident cannot access other tenant URLs
- [ ] Admin can access all tenant data
- [ ] Admin cannot access other tenant data
- [ ] Super admin can switch tenants
- [ ] RLS policies block unauthorized queries (test in Supabase)

## Core Features (Resident)
### Dashboard
- [ ] Dashboard loads in <2s
- [ ] Widgets display relevant data
- [ ] Quick actions work (create event, check-in, etc.)
- [ ] Notifications display

### Community Map
- [ ] Map loads with correct location (Ecovilla San Mateo)
- [ ] Lots, roads, amenities display correctly
- [ ] "View on Map" from other features works
- [ ] Highlight location works
- [ ] Search locations works
- [ ] Click location shows details

### Events
- [ ] Browse events (list + calendar view)
- [ ] Filter events by category, date
- [ ] Event detail page displays all info
- [ ] RSVP works (going, maybe, not going)
- [ ] Create event (resident + admin)
- [ ] Edit event (creator + admin)
- [ ] Delete event (creator + admin)
- [ ] Event notifications sent

### Check-Ins
- [ ] Create check-in with location
- [ ] Status options work (traveling, at home, away)
- [ ] Duration tracking works
- [ ] Active check-ins display on map
- [ ] Edit/end check-in works
- [ ] Privacy settings respected

### Community Exchange
- [ ] Browse listings (filter by category, type)
- [ ] Listing detail page displays
- [ ] Create listing with images
- [ ] Edit listing
- [ ] Mark as sold/rented
- [ ] Delete listing
- [ ] Search listings

### Neighbors
- [ ] Directory displays all residents
- [ ] Search by name, interests, skills
- [ ] Filter works
- [ ] Detailed profile view
- [ ] Privacy settings respected (hide profile)
- [ ] Public vs. private profile views

### Requests
- [ ] Browse requests
- [ ] Create request
- [ ] Respond to request
- [ ] Mark request as completed
- [ ] Delete request

### Announcements
- [ ] View all announcements
- [ ] Filter by priority, date
- [ ] Announcement detail view

### Notifications
- [ ] Notification center displays all notifications
- [ ] Mark as read works
- [ ] Click notification navigates to entity
- [ ] Notification preferences save

## Core Features (Admin)
### Resident Management
- [ ] View residents list
- [ ] Search + filter residents
- [ ] Create resident manually
- [ ] Edit resident profile
- [ ] Assign resident to family
- [ ] Assign resident to lot
- [ ] Send invite to resident
- [ ] Deactivate resident

### Family Management
- [ ] View families list
- [ ] Create family
- [ ] Edit family
- [ ] Assign members to family
- [ ] Assign lot to family
- [ ] Delete family

### Map Management
- [ ] View all locations
- [ ] Create location (manual)
- [ ] Edit location
- [ ] Delete location
- [ ] GeoJSON import works (<480KB files)
- [ ] Import validation (file type, structure)

### Event Management
- [ ] View all events
- [ ] Create event as admin
- [ ] Edit any event
- [ ] Delete any event
- [ ] View attendees

### Content Management
- [ ] Manage interests (add, edit, delete)
- [ ] Manage skills (add, edit, delete)
- [ ] Manage event categories
- [ ] Manage exchange categories

## Performance
- [ ] Dashboard loads in <2s (mobile 3G)
- [ ] Map loads in <2s
- [ ] Image uploads work (<5MB)
- [ ] GeoJSON uploads work (split files if >480KB)
- [ ] No freezing during interactions
- [ ] Lighthouse mobile score 80+

## Mobile Experience
- [ ] Bottom navigation works
- [ ] Touch targets ≥44px
- [ ] Forms are usable on mobile
- [ ] Images load properly
- [ ] No horizontal scrolling
- [ ] Pull-to-refresh works

## Accessibility
- [ ] Keyboard navigation works on critical flows
- [ ] Screen reader announces page titles
- [ ] Forms have proper labels
- [ ] Error messages are clear
- [ ] Color contrast meets WCAG AA

## Error Handling
- [ ] Network errors show user-friendly messages
- [ ] Form validation errors are clear
- [ ] 404 page displays
- [ ] 500 errors caught by error boundary
- [ ] Loading states display during async actions
```

**Automated Testing** (Post-Alpha, WP10+):

- **Unit Tests**: Jest + React Testing Library
  - Test utility functions
  - Test React components in isolation
  - Test custom hooks
  - Target: 70% coverage on critical paths

- **Integration Tests**: Playwright
  - Test API endpoints
  - Test database queries
  - Test multi-step workflows
  - Target: Cover 10 critical user journeys

- **E2E Tests**: Playwright
  - Test onboarding flow
  - Test event creation + RSVP
  - Test map interactions
  - Test admin workflows
  - Target: 5 smoke tests, run on every deploy

**Load Testing** (Pre-Public Launch):

- Use k6 or Artillery
- Simulate 100 concurrent users
- Test: Dashboard load, map rendering, event browsing
- Target: <2s p95 response time, 99.5% success rate

**Security Testing**:

- Manual RLS audit (SQL queries)
- Automated: OWASP ZAP or similar
- Test: SQL injection, XSS, CSRF
- Penetration test (optional, hire external)

---

## Development Workflow

### Tool Selection & Usage

**Primary Development Environment**: Cursor AI

**Why Cursor over alternatives**:
- ✅ Better codebase understanding (indexes entire repo)
- ✅ Composer Mode for multi-file edits (critical for migration)
- ✅ Works with existing IDEs (VS Code fork)
- ✅ Better TypeScript support
- ✅ Cost: $20/month (vs. Claude Pro $20 + v0 $20 = $40)

**Cursor Setup**:

1. Install Cursor (https://cursor.com)
2. Clone repo: `git clone <your-repo>`
3. Create `.cursorrules` file in root:

```
# Ecovilla Platform Development Rules

## Project Context
- Multi-tenant SaaS for community management
- Next.js 16 (App Router), TypeScript, Supabase, Tailwind
- 61 screens across super admin, tenant admin, resident roles
- Currently in alpha preparation phase

## Code Style
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use async/await over promises
- Use Tailwind for styling (no CSS modules)
- Follow Next.js App Router conventions
- Use server components by default, client components when needed

## Database
- Always use RLS policies (never bypass)
- Use prepared statements (parameterized queries)
- Add indexes for frequently queried columns
- Use transactions for multi-table operations

## Security
- Never expose sensitive data in client components
- Validate all user input (client + server)
- Use Zod for schema validation
- Check user permissions before every data mutation

## Patterns to Follow
- Data fetching: Use server components or server actions
- Forms: Use react-hook-form + Zod validation
- API routes: `/app/api/v1/*` structure
- Components: Reusable components in `/components/ecovilla/`
- Data layer: Centralized in `/lib/data/*`

## Patterns to Avoid
- Direct Supabase calls from client components
- Inline styles (use Tailwind)
- any type (use proper TypeScript types)
- console.log in production (use proper logging)

## When Unsure
1. Check design system documentation
2. Look for similar patterns in existing code
3. Prioritize user experience and security
4. Ask for clarification before making assumptions

## Current Migration
- Migrating from residents table → users table
- Always query users table with role='resident' filter
- Use user_interests, user_skills (not resident_*)
```

4. Configure Cursor settings:

```json
// .vscode/settings.json or Cursor settings
{
  "cursor.aiRules": ".cursorrules",
  "cursor.contextualCompletion": true,
  "cursor.maxTokens": 4000,
  "cursor.temperature": 0.2,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*)[\"'`]"]
  ]
}
```

5. Learn key commands:
   - `Cmd/Ctrl + K`: Inline chat
   - `Cmd/Ctrl + L`: Sidebar chat
   - `Cmd/Ctrl + Shift + L`: Composer Mode (multi-file edits)

6. Use context shortcuts:
   - `@filename`: Add file to context
   - `@folder`: Add folder to context
   - `@web`: Search web for latest info

**Example Cursor Prompt** (for migration):

```
Cmd + Shift + L (Composer Mode)

@app/t/[slug]/admin/residents/page.tsx 
@app/t/[slug]/admin/residents/residents-table.tsx
@lib/data/residents.ts

Task: Update these files for the residents→users migration.

Pattern to follow:
- BEFORE: .from("residents")
- AFTER: .from("users").eq("role", "resident")

- BEFORE: .from("resident_interests")
- AFTER: .from("user_interests")

- BEFORE: resident_id
- AFTER: user_id

Please update all 3 files following this pattern. Make sure:
1. All queries filter by role='resident'
2. All junction tables use user_* naming
3. TypeScript types are updated
4. No other logic changes

List all changes made so I can review.
```

---

**Supporting Tools**:

**Claude Projects** (Planning & Architecture):
- Use for high-level planning
- Architecture discussions
- Work package creation
- Technical decision documentation
- Cost: $20/month (Claude Pro)

**v0.dev** (Rapid Prototyping - Optional):
- Use sparingly for new complex components
- Avoid for refactoring existing code
- Cost: $20/month (can cancel after alpha)
- **Recommendation**: Cancel after WP3 to save money

**CodeRabbit** (Code Quality - Optional):
- Integrate after WP1 complete
- Automated PR reviews
- Security checks
- Cost: Free tier or $12/month
- **Recommendation**: Add during beta

**GitHub** (Version Control):
- Branch strategy: `main` (production), `develop` (testing), feature branches
- Commit often with clear messages
- Tag releases (e.g., `v0.1.0-alpha`)

**Supabase** (Database + Auth):
- Upgrade to Pro plan during alpha ($25/month)
- Enable daily backups
- Monitor query performance

**Vercel** (Hosting):
- Upgrade to Pro during alpha ($20/month)
- Enable analytics
- Set up preview deployments

---

### Daily Workflow

**Typical Development Session** (2-3 hours):

1. **Plan** (15 min):
   - Review work package tasks
   - Identify files to modify
   - Write clear Cursor prompt

2. **Execute** (90 min):
   - Use Cursor Composer for multi-file edits
   - Test locally after each change
   - Commit incrementally

3. **Test** (30 min):
   - Manual testing of affected features
   - Check mobile + desktop
   - Verify no regressions

4. **Document** (15 min):
   - Update progress in work package artifact
   - Note any blockers or decisions
   - Update GitHub issues

---

### Git Workflow

**Branch Strategy**:

```
main (production)
  ├── develop (testing/staging)
      ├── feature/wp1-database-migration
      ├── feature/wp2-design-system
      ├── feature/wp3-component-library
      └── ...
```

**Commit Message Format**:

```
[WP1] Complete residents→users migration for admin files

- Updated app/t/[slug]/admin/residents/page.tsx
- Updated app/t/[slug]/admin/residents/residents-table.tsx
- Updated lib/data/residents.ts
- Added role='resident' filter to all queries
- Tested: Admin residents list, create, edit flows
```

**Pull Request Process**:

1. Create feature branch: `git checkout -b feature/wp1-database-migration`
2. Make changes, commit incrementally
3. Push to GitHub: `git push origin feature/wp1-database-migration`
4. Create PR to `develop`
5. Self-review (use CodeRabbit if integrated)
6. Merge to `develop`, test on preview deployment
7. If stable, merge `develop` → `main`

---

### Deployment Strategy

**Environments**:

1. **Local Development**: `localhost:3000`
   - Use for all development
   - Connected to Supabase dev project

2. **Preview (Vercel)**: `feature-branch.vercel.app`
   - Auto-deployed on PR
   - Use for testing before merge
   - Connected to Supabase dev project

3. **Staging (develop branch)**: `dev.yourapp.com`
   - Deployed from `develop` branch
   - Use for alpha/beta testing
   - Connected to Supabase staging project

4. **Production (main branch)**: `app.yourapp.com`
   - Deployed from `main` branch
   - Only deploy after thorough testing
   - Connected to Supabase production project

**Deployment Checklist** (Before deploying to production):

- [ ] All tests pass locally
- [ ] Feature tested on preview deployment
- [ ] Database migrations run successfully
- [ ] Environment variables set
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Backup taken (Supabase + Vercel)

---

## Critical Implementation Details

### Database Migration: Residents → Users

**Context**:
- Initially built with separate `residents` table
- Decided to unify into `users` table with role-based access
- More scalable for multi-role users (e.g., resident + admin)
- Simplifies queries and permissions

**Migration Scripts** (Already Run):

1. **022_users_table_migration.sql**:
   - Created `users` table with all resident fields
   - Added `role` enum (super_admin, tenant_admin, resident)
   - Added `migrated_to_user_id` column to `residents` table

2. **023_user_junction_tables.sql**:
   - Created `user_interests`, `user_skills`, `user_privacy_settings`
   - Mirrors structure of `resident_*` tables

3. **024_migrate_data.sql**:
   - Copied all data from `residents` → `users`
   - Copied all data from `resident_interests` → `user_interests`
   - Copied all data from `resident_skills` → `user_skills`
   - Set `migrated_to_user_id` for all residents

**Current State**:
- ✅ Database tables exist
- ✅ Data migrated
- ❌ Only 3 files updated to use new tables
- ❌ 49 files still query old `residents` table

**Files Already Updated**:
1. `app/api/link-resident/route.ts`
2. `app/onboarding/steps/profile/page.tsx`
3. `app/t/[slug]/admin/residents/page.tsx` (partial)

**Files to Update** (49 remaining):

**Category 1: Auth & Onboarding (8 files)**:
- `app/onboarding/[step]/page.tsx` (main layout)
- `app/onboarding/steps/journey/page.tsx`
- `app/onboarding/steps/interests/page.tsx`
- `app/onboarding/steps/skills/page.tsx`
- `app/onboarding/steps/family/page.tsx`
- `app/onboarding/steps/complete/page.tsx`
- `lib/auth/create-user.ts` (if exists)
- `app/api/accept-invite/route.ts`

**Category 2: Admin Files (12 files)**:
- `app/t/[slug]/admin/residents/create/page.tsx`
- `app/t/[slug]/admin/residents/[id]/edit/page.tsx`
- `app/t/[slug]/admin/residents/[id]/edit/edit-resident-form.tsx`
- `app/t/[slug]/admin/residents/residents-table.tsx`
- `app/t/[slug]/admin/families/page.tsx`
- `app/t/[slug]/admin/families/[id]/edit/page.tsx`
- `app/t/[slug]/admin/families/create/page.tsx`
- `app/t/[slug]/admin/dashboard/page.tsx`
- `app/t/[slug]/admin/map/locations/page.tsx` (if queries residents)
- `lib/data/residents.ts` (data layer)
- `lib/queries/*` (any query files)

**Category 3: Resident Dashboard (10 files)**:
- `app/t/[slug]/dashboard/page.tsx`
- `app/t/[slug]/dashboard/settings/profile/page.tsx`
- `app/t/[slug]/dashboard/settings/profile/profile-edit-form.tsx`
- `app/t/[slug]/dashboard/settings/privacy/page.tsx`
- `app/t/[slug]/dashboard/settings/privacy/privacy-settings-form.tsx`
- `app/t/[slug]/dashboard/neighbours/page.tsx`
- `app/t/[slug]/dashboard/neighbours/[id]/page.tsx`
- `components/dashboard/neighbors-widget.tsx` (if exists)
- `components/profile/profile-card.tsx` (if exists)

**Category 4: Feature Files (15 files)**:
- `app/t/[slug]/dashboard/events/create/page.tsx` (if queries residents)
- `app/t/[slug]/dashboard/events/[id]/page.tsx` (show attendees)
- `app/t/[slug]/dashboard/exchange/create/page.tsx` (user context)
- `app/t/[slug]/dashboard/exchange/[id]/page.tsx` (show owner)
- `app/t/[slug]/dashboard/check-ins/create/page.tsx` (user context)
- `app/t/[slug]/dashboard/check-ins/page.tsx` (show check-ins)
- `app/t/[slug]/dashboard/requests/create/page.tsx` (user context)
- `app/t/[slug]/dashboard/requests/[id]/page.tsx` (show requester)
- `components/events/event-card.tsx` (if shows attendees)
- `components/exchange/listing-card.tsx` (if shows owner)
- `components/check-ins/check-in-card.tsx` (if shows user)
- `components/maps/GoogleMapEditor.tsx` (if highlights residents)

**Category 5: Utility Files (4 files)**:
- `lib/supabase/queries/get-resident.ts` (if exists)
- `lib/utils/format-resident-name.ts` (if exists)
- `hooks/use-current-resident.ts` (if exists)
- Any file with `resident` in the filename

**Migration Pattern** (Apply to all files):

```typescript
// BEFORE (Old Pattern)
const { data: residents } = await supabase
  .from("residents")
  .select("*")
  .eq("tenant_id", tenantId)

// AFTER (New Pattern)
const { data: residents } = await supabase
  .from("users")
  .select("*")
  .eq("tenant_id", tenantId)
  .eq("role", "resident")

// BEFORE (Junction Tables)
const { data: interests } = await supabase
  .from("resident_interests")
  .select("*, interest:interests(*)")
  .eq("resident_id", residentId)

// AFTER
const { data: interests } = await supabase
  .from("user_interests")
  .select("*, interest:interests(*)")
  .eq("user_id", userId)

// BEFORE (Column Names)
family_member.resident_id

// AFTER
family_member.user_id
```

**Verification SQL Queries**:

```sql
-- 1. Verify all residents migrated
SELECT COUNT(*) FROM residents WHERE migrated_to_user_id IS NULL;
-- Expected: 0

-- 2. Verify users table has all residents
SELECT COUNT(*) FROM users WHERE role = 'resident';
-- Expected: Same as residents count

-- 3. Check data integrity
SELECT 
  r.id as old_id,
  r.first_name,
  r.last_name,
  u.id as new_id,
  r.migrated_to_user_id
FROM residents r
LEFT JOIN users u ON r.migrated_to_user_id = u.id
WHERE u.id IS NULL;
-- Expected: 0 rows

-- 4. Verify junction tables
SELECT COUNT(*) FROM resident_interests;
SELECT COUNT(*) FROM user_interests;
-- user_interests should match or exceed resident_interests

-- 5. Find any remaining references to old tables (run after migration)
-- Search codebase for:
-- - .from("residents")
-- - .from("resident_interests")
-- - .from("resident_skills")
-- - resident_id (as column name)
```

**Testing Checklist After Migration**:

- [ ] Login works (creates user in users table)
- [ ] Onboarding saves to users table
- [ ] Admin can view residents (queries users table)
- [ ] Admin can create resident (inserts into users table)
- [ ] Admin can edit resident (updates users table)
- [ ] Resident can view profile (queries users table)
- [ ] Resident can edit profile (updates users table)
- [ ] Interests/skills save correctly (user_interests, user_skills)
- [ ] Privacy settings work (user_privacy_settings)
- [ ] Neighbor directory works (queries users table)
- [ ] Family assignments work (family_members uses user_id)
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Database queries use indexes (check EXPLAIN ANALYZE)

---

### RLS Policy Audit

**Critical Security Requirement**: Every table with multi-tenant data MUST have RLS policies.

**Tables Requiring Audit** (20+ tables):

1. ✅ `tenants` - Policies exist, verify they're correct
2. ⚠️ `users` - **CRITICAL**: Verify tenant isolation
3. `families` - Verify tenant isolation
4. `family_members` - Verify tenant isolation
5. `locations` - Verify tenant isolation
6. `events` - Verify tenant isolation + visibility settings
7. `event_attendees` - Verify tenant isolation
8. `exchange_listings` - Verify tenant isolation + privacy
9. `check_ins` - Verify tenant isolation + privacy
10. `requests` - Verify tenant isolation + visibility
11. `announcements` - Verify tenant isolation
12. `notifications` - Verify user can only see own
13. `user_interests` - Verify user can only edit own
14. `user_skills` - Verify user can only edit own
15. `user_privacy_settings` - Verify user can only edit own
16. `interests` - Public read, admin write
17. `skills` - Public read, admin write
18. `event_categories` - Tenant-scoped
19. `exchange_categories` - Tenant-scoped
20. `audit_logs` (if exists) - Super admin only

**RLS Policy Template**:

```sql
-- Example: Events table

-- Policy 1: Tenant Isolation (SELECT)
CREATE POLICY "Users can only view events in their tenant"
ON events
FOR SELECT
USING (
  tenant_id = (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Policy 2: Insert (Residents + Admins can create)
CREATE POLICY "Residents and admins can create events"
ON events
FOR INSERT
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  AND
  (SELECT role FROM users WHERE id = auth.uid()) IN ('resident', 'tenant_admin', 'super_admin')
);

-- Policy 3: Update (Creator + Admins can edit)
CREATE POLICY "Event creators and admins can update events"
ON events
FOR UPDATE
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  AND
  (
    created_by_user_id = auth.uid()
    OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('tenant_admin', 'super_admin')
  )
);

-- Policy 4: Delete (Creator + Admins can delete)
CREATE POLICY "Event creators and admins can delete events"
ON events
FOR DELETE
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  AND
  (
    created_by_user_id = auth.uid()
    OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('tenant_admin', 'super_admin')
  )
);
```

**Testing RLS Policies**:

```sql
-- Test 1: Tenant Isolation
-- Login as user from Tenant A
SELECT * FROM events;
-- Should ONLY return events from Tenant A

-- Test 2: Cross-Tenant Access
-- Try to query Tenant B data directly
SELECT * FROM events WHERE tenant_id = '<tenant-b-id>';
-- Should return 0 rows (blocked by RLS)

-- Test 3: Role Permissions
-- Login as resident
UPDATE events SET title = 'Hacked' WHERE created_by_user_id != auth.uid();
-- Should fail (RLS blocks updates to other users' events)

-- Test 4: Super Admin Bypass
-- Login as super admin
SELECT * FROM events;
-- Should return events from ALL tenants

-- Test 5: Unauthenticated Access
-- Logout (no auth.uid())
SELECT * FROM events;
-- Should return 0 rows (all RLS policies fail without auth)
```

**Common RLS Mistakes to Fix**:

1. **Missing Tenant Filter**: Policy allows cross-tenant access
   ```sql
   -- BAD
   USING (created_by_user_id = auth.uid())
   
   -- GOOD
   USING (
     tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
     AND created_by_user_id = auth.uid()
   )
   ```

2. **Over-Permissive Super Admin**: Bypasses tenant isolation entirely
   ```sql
   -- BAD (allows super admin to see all tenants without explicit intent)
   USING ((SELECT role FROM users WHERE id = auth.uid()) = 'super_admin')
   
   -- GOOD (require explicit tenant context)
   USING (
     tenant_id = current_setting('app.current_tenant_id')::uuid
     OR (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
   )
   ```

3. **Missing Policies for Some Operations**: Only SELECT policy, no INSERT/UPDATE/DELETE
   - Always define policies for ALL operations (SELECT, INSERT, UPDATE, DELETE)

4. **Using wrong auth context**: Checking `user_id` instead of `auth.uid()`
   ```sql
   -- BAD
   USING (created_by_user_id = user_id)
   
   -- GOOD
   USING (created_by_user_id = auth.uid())
   ```

---

### Performance Optimization

**Known Bottlenecks**:

1. **GeoJSON Upload** (Freezes on files >480KB)
   - **Problem**: Processing large GeoJSON files blocks main thread
   - **Solution**: Use Web Worker to process in background
   - **Implementation**:
     ```typescript
     // lib/workers/geojson-processor.worker.ts
     self.onmessage = (e) => {
       const geojson = JSON.parse(e.data);
       // Process in chunks
       const features = geojson.features;
       const chunkSize = 50;
       for (let i = 0; i < features.length; i += chunkSize) {
         const chunk = features.slice(i, i + chunkSize);
         // Process chunk
         self.postMessage({ progress: i / features.length, chunk });
       }
     };
     ```

2. **Dashboard Loading** (Slow on first load)
   - **Problem**: Multiple sequential queries
   - **Solution**: Parallel queries + caching
   - **Implementation**:
     ```typescript
     // BEFORE (Sequential)
     const events = await getEvents();
     const checkIns = await getCheckIns();
     const announcements = await getAnnouncements();
     
     // AFTER (Parallel)
     const [events, checkIns, announcements] = await Promise.all([
       getEvents(),
       getCheckIns(),
       getAnnouncements(),
     ]);
     ```

3. **Image Loading** (Not optimized)
   - **Problem**: Using `<img>` tags instead of Next.js `<Image>`
   - **Solution**: Migrate to `next/image` for automatic optimization
   - **Implementation**:
     ```tsx
     // BEFORE
     <img src={resident.profile_picture_url} alt={resident.name} />
     
     // AFTER
     import Image from 'next/image';
     <Image 
       src={resident.profile_picture_url} 
       alt={resident.name}
       width={96}
       height={96}
       loading="lazy"
     />
     ```

4. **Missing Database Indexes**
   - **Problem**: Slow queries on frequently filtered columns
   - **Solution**: Add indexes
   - **SQL**:
     ```sql
     -- Add indexes for common queries
     CREATE INDEX idx_users_tenant_id ON users(tenant_id);
     CREATE INDEX idx_users_role ON users(role);
     CREATE INDEX idx_events_tenant_id_start_time ON events(tenant_id, start_time);
     CREATE INDEX idx_exchange_listings_tenant_id_status ON exchange_listings(tenant_id, status);
     CREATE INDEX idx_locations_tenant_id_type ON locations(tenant_id, type);
     
     -- Add composite indexes for common joins
     CREATE INDEX idx_family_members_family_user ON family_members(family_id, user_id);
     CREATE INDEX idx_event_attendees_event_user ON event_attendees(event_id, user_id);
     ```

**Performance Targets**:

- **Page Load**: <2s on 3G connection
- **Time to Interactive**: <3s on 3G
- **Lighthouse Score**: 80+ on mobile, 90+ on desktop
- **API Response**: <500ms p95
- **Database Queries**: <100ms p95

**Monitoring**:

- Use Vercel Analytics (built-in)
- Use Supabase Query Performance (built-in)
- Add Sentry for error tracking (free tier: 5k events/month)
- Use Lighthouse CI in GitHub Actions

---

### API Architecture (WP1 - Foundation)

**Goal**: Build API-first architecture for:
- Future AI assistant integration
- External integrations (Telegram, Zapier, etc.)
- Mobile app (if needed later)
- Better separation of concerns

**API Structure**:

```
/app/api/v1/
├── auth/
│   ├── login/route.ts
│   ├── logout/route.ts
│   └── refresh/route.ts
├── tenants/
│   ├── route.ts (GET, POST)
│   └── [id]/route.ts (GET, PATCH, DELETE)
├── users/
│   ├── route.ts (GET, POST)
│   ├── [id]/route.ts (GET, PATCH, DELETE)
│   └── [id]/interests/route.ts
├── events/
│   ├── route.ts (GET, POST)
│   ├── [id]/route.ts (GET, PATCH, DELETE)
│   └── [id]/attendees/route.ts
├── locations/
│   ├── route.ts (GET, POST)
│   ├── [id]/route.ts (GET, PATCH, DELETE)
│   └── import/route.ts (POST - GeoJSON upload)
├── check-ins/
│   ├── route.ts (GET, POST)
│   └── [id]/route.ts (GET, PATCH, DELETE)
├── exchange/
│   ├── listings/route.ts (GET, POST)
│   └── listings/[id]/route.ts (GET, PATCH, DELETE)
├── announcements/
│   ├── route.ts (GET, POST)
│   └── [id]/route.ts (GET, PATCH, DELETE)
└── ai/ (WP10 - Post-Alpha)
    └── query/route.ts (POST)
```

**API Route Template**:

```typescript
// app/api/v1/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { rateLimiter } from '@/lib/api/rate-limiter';

const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  location_id: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip ?? 'anonymous';
    const { success } = await rateLimiter.limit(identifier);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Auth
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant context
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Query params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Fetch data (RLS handles tenant isolation)
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: events,
      pagination: {
        limit,
        offset,
        total: events.length,
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip ?? 'anonymous';
    const { success } = await rateLimiter.limit(identifier);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Auth
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const validationResult = eventSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error },
        { status: 400 }
      );
    }

    // Get tenant context
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Insert (RLS handles permissions)
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        ...validationResult.data,
        tenant_id: userData.tenant_id,
        created_by_user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { data: event },
      { status: 201 }
    );

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Rate Limiting**:

```typescript
// lib/api/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
  analytics: true,
  prefix: 'api',
});
```

**Data Layer** (Centralized Queries):

```typescript
// lib/data/events.ts
import { createClient } from '@/lib/supabase/server';

export async function getEvents(tenantId: string, filters?: EventFilters) {
  const supabase = createClient();
  
  let query = supabase
    .from('events')
    .select('*, location:locations(*), attendees:event_attendees(count)')
    .eq('tenant_id', tenantId);

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.startDate) {
    query = query.gte('start_time', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('end_time', filters.endDate);
  }

  const { data, error } = await query.order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getEvent(eventId: string, tenantId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('events')
    .select('*, location:locations(*), attendees:event_attendees(*, user:users(*))')
    .eq('id', eventId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) throw error;
  return data;
}

export async function createEvent(eventData: CreateEventInput, userId: string, tenantId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      tenant_id: tenantId,
      created_by_user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ... similar for update, delete
```

---

### Design System (WP2)

**Design Tokens** (CSS Variables):

```css
/* app/globals.css */

:root {
  /* Colors */
  --color-primary: 34 197 94; /* Green 500 - emerald */
  --color-primary-hover: 22 163 74; /* Green 600 */
  --color-secondary: 251 191 36; /* Amber 400 */
  --color-secondary-hover: 245 158 11; /* Amber 500 */
  
  --color-background: 255 255 255;
  --color-foreground: 15 23 42; /* Slate 900 */
  --color-muted: 241 245 249; /* Slate 100 */
  --color-muted-foreground: 100 116 139; /* Slate 500 */
  
  --color-border: 226 232 240; /* Slate 200 */
  --color-ring: 34 197 94; /* Green 500 */
  
  /* Semantic Colors */
  --color-success: 34 197 94; /* Green 500 */
  --color-warning: 251 191 36; /* Amber 400 */
  --color-error: 239 68 68; /* Red 500 */
  --color-info: 59 130 246; /* Blue 500 */
  
  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Fira Code', 'Courier New', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  /* Spacing (4px base) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  
  /* Radius */
  --radius-sm: 0.25rem;  /* 4px */
  --radius-md: 0.5rem;   /* 8px */
  --radius-lg: 0.75rem;  /* 12px */
  --radius-xl: 1rem;     /* 16px */
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

.dark {
  --color-background: 15 23 42; /* Slate 900 */
  --color-foreground: 248 250 252; /* Slate 50 */
  --color-muted: 30 41 59; /* Slate 800 */
  --color-muted-foreground: 148 163 184; /* Slate 400 */
  --color-border: 51 65 85; /* Slate 700 */
}
```

**Typography Scale**:

```typescript
// Example usage in Tailwind config
module.exports = {
  theme: {
    extend: {
      fontSize: {
        'xs': 'var(--text-xs)',
        'sm': 'var(--text-sm)',
        'base': 'var(--text-base)',
        'lg': 'var(--text-lg)',
        'xl': 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
      },
    },
  },
};
```

**Component Patterns**:

```tsx
// components/ecovilla/page-header.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Usage:
<PageHeader 
  title="Community Events"
  description="Upcoming events and activities"
  action={<Button>Create Event</Button>}
/>
```

---

### Mobile Optimization (WP5-6)

**Bottom Navigation**:

```tsx
// components/ecovilla/mobile-nav.tsx
import { Home, Map, Calendar, Users, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/map', icon: Map, label: 'Map' },
  { href: '/dashboard/events', icon: Calendar, label: 'Events' },
  { href: '/dashboard/neighbours', icon: Users, label: 'Neighbors' },
  { href: '/dashboard/menu', icon: Menu, label: 'More' },
];

export function MobileNav() {
  const pathname = usePathname();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Touch Targets**:

```tsx
// Ensure all interactive elements are ≥44px
<button className="h-11 px-4 py-2"> {/* 44px height */}
  Click Me
</button>

// Or use min-h-11, min-w-11 for icon buttons
<button className="min-h-11 min-w-11 flex items-center justify-center">
  <Icon className="h-6 w-6" />
</button>
```

**Mobile-Specific Patterns**:

```tsx
// Swipeable sheet for filters (mobile)
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline" className="md:hidden">
      <Filter className="h-4 w-4 mr-2" />
      Filters
    </Button>
  </SheetTrigger>
  <SheetContent side="bottom" className="h-[80vh]">
    {/* Filter content */}
  </SheetContent>
</Sheet>

// Desktop: Show filters inline
<div className="hidden md:block">
  {/* Filter content */}
</div>
```

---

## Success Metrics

### Alpha Launch Success Criteria

**Technical**:
- ✅ Zero critical security vulnerabilities (RLS audit passed)
- ✅ Zero blocking bugs in core flows
- ✅ Lighthouse mobile score ≥80
- ✅ Page load <2s on 3G
- ✅ All 49 files migrated to users table
- ✅ Performance targets met (API <500ms, DB queries <100ms)

**User Experience**:
- ✅ Onboarding completion rate ≥80%
- ✅ Net Promoter Score (NPS) ≥40
- ✅ Weekly Active Users (WAU) ≥60%
- ✅ Avg session duration ≥5 minutes
- ✅ <10 critical bugs reported in first 2 weeks

**Product**:
- ✅ 20-30 residents successfully using the platform
- ✅ Core features stable (events, map, check-ins, exchange)
- ✅ Feedback loop working (in-app button + WhatsApp group)
- ✅ Documentation complete (getting started guide + video)

---

### Beta Launch Success Criteria

**Technical**:
- ✅ Lighthouse mobile score ≥90
- ✅ Automated test coverage ≥70% on critical paths
- ✅ Zero security vulnerabilities (external audit passed)
- ✅ Performance: 99.5% uptime, <2s p95 page load
- ✅ Monitoring + alerting active (Sentry, UptimeRobot)

**User Experience**:
- ✅ NPS ≥50
- ✅ WAU ≥70%
- ✅ Retention: 80% of alpha users still active
- ✅ <5 bugs per week reported
- ✅ Feature adoption: 60%+ users using events, map, check-ins

**Product**:
- ✅ 100+ residents using the platform
- ✅ All features launched (events, exchange, check-ins, requests, AI assistant)
- ✅ Admin screens optimized for efficiency
- ✅ Case study complete (testimonials, metrics, screenshots)

**Business**:
- ✅ Legal docs ready (terms, privacy, SLA)
- ✅ Payment integration tested
- ✅ Marketing website live
- ✅ Sales collateral ready (deck, one-pager)
- ✅ First 3 sales calls completed with other communities

---

### Public Launch Success Criteria

**Technical**:
- ✅ Production infrastructure scaled (Supabase Pro, Vercel Pro)
- ✅ Database performance optimized (indexes, query optimization)
- ✅ CDN configured for assets (Cloudflare)
- ✅ Backups automated (daily snapshots)
- ✅ Disaster recovery plan documented

**User Experience**:
- ✅ NPS ≥60
- ✅ WAU ≥70%
- ✅ Churn <10% monthly
- ✅ Support tickets <5 per week per 100 users

**Product**:
- ✅ Native mobile apps (iOS + Android) - Optional
- ✅ Advanced features launched (AI assistant, analytics dashboard)
- ✅ Integrations (Zapier, Telegram bot, email)

**Business**:
- ✅ 5-10 paying communities onboarded
- ✅ Monthly Recurring Revenue (MRR) ≥$5k
- ✅ Customer Acquisition Cost (CAC) <$500
- ✅ Lifetime Value (LTV) ≥$5k
- ✅ Churn ≤10% monthly

---

## Appendix

### Key Resources

**Documentation**:
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com

**Tools**:
- Cursor: https://cursor.com
- Vercel: https://vercel.com
- Supabase: https://supabase.com
- GitHub: https://github.com

**Community**:
- Next.js Discord
- Supabase Discord
- Indie Hackers (for founder support)

---

### Contact & Support

**Founder**: MJ (you!)
**Email**: [your-email]
**GitHub**: [your-github]
**Project**: Ecovilla Community Platform

**Feedback**:
- In-app feedback button (for testers)
- Email: feedback@yourapp.com
- WhatsApp group (alpha testers)

---

## Changelog

**v1.0 - November 19, 2024**:
- Initial comprehensive onboarding document created
- Includes business context, technical architecture, 12 work packages
- Testing strategy, development workflow, critical implementation details
- Ready for AI IDE/Cursor integration

---

**End of Document**

This document should be treated as a living document. Update it as:
- Work packages are completed
- New decisions are made
- Architecture evolves
- New features are added

Use this document as the single source of truth for all AI-assisted development in Cursor.