# Ecovilla Community Platform - Current State Overview

**Version**: 2.0  
**Created**: November 23, 2024  
**Last Updated**: December 24, 2024  
**Purpose**: Comprehensive overview for market research, competitive analysis, and go-to-market planning  
**Status**: Alpha Ready

---

## Executive Summary

**Ecovilla Community Platform** is a multi-tenant SaaS solution designed specifically for intentional communities, eco-villages, HOAs, and residential developments. The platform replaces fragmented communication tools (WhatsApp, Facebook Groups) with a unified, location-aware community management system.

### Key Metrics (December 2024)
- **340+ components** across the application
- **65+ screens** across 3 user roles (Super Admin, Tenant Admin, Resident)
- **15 server actions** for data operations
- **API v1** with 6 domain endpoints
- **Mobile dock navigation** implemented
- **Rich text editor** for announcements and content

### Business Model
- **Revenue**: Usage-based pricing (~$3/lot/month or ~$3/resident/month)
- **Target Market**: 250+ eco-villages in Central/South America, 30,000+ HOAs in North America
- **Bootstrap Approach**: Solo non-technical founder, AI-assisted development

---

## 1. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | ^16.0.10 | React framework with App Router |
| **React** | ^19.2.1 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.1.9 | Utility-first styling |
| **shadcn/ui** | Latest | Component library (40 components) |
| **Framer Motion** | ^12.23.24 | Animations |
| **Lucide React** | ^0.454.0 | Icon system |
| **react-icons** | ^5.5.0 | Additional icons |

### Mapping (Mapbox Stack)
| Technology | Version | Purpose |
|------------|---------|---------|
| **mapbox-gl** | ^2.15.0 | Primary map library |
| **react-map-gl** | ^7.1.7 | React wrapper for Mapbox |
| **@mapbox/mapbox-gl-draw** | ^1.5.1 | Drawing tools (polygons, lines) |
| **@mapbox/search-js-react** | ^1.5.0 | Location autocomplete |
| **@turf/turf** | ^7.3.0 | Geospatial analysis |

### Rich Text Editing
| Technology | Version | Purpose |
|------------|---------|---------|
| **@tiptap/react** | ^3.13.0 | Rich text editor |
| **@tiptap/extension-link** | ^3.13.0 | Link support |
| **@tiptap/extension-table** | ^3.13.0 | Table editing |
| **@tiptap/extension-text-align** | ^3.13.0 | Text alignment |
| **@tiptap/extension-underline** | ^3.13.0 | Underline formatting |
| **dompurify** | ^3.3.1 | HTML sanitization |

### Backend & Infrastructure
| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database, authentication, real-time, storage |
| **Vercel** | Hosting, serverless functions, deployments |
| **Vercel Blob** | File storage for images/uploads |
| **Upstash Redis** | Rate limiting |

### Data & Forms
- **react-hook-form** + **Zod** - Form validation
- **SWR** - Data fetching and caching
- **date-fns** - Date manipulation
- **recharts** - Data visualization

### Development Tools
- **Storybook** - Component documentation and testing
- **Cursor AI / Gemini** - Code generation and refactoring
- **Claude Projects** - Architecture planning
- **GitHub** - Version control

---

## 2. Architecture Overview

### 2.1 Multi-Tenancy
**Tenant isolation** at the database level:
- Each community is a separate tenant with unique slug (e.g., `/t/ecovilla-san-mateo`)
- Row-Level Security (RLS) ensures data isolation
- Custom branding per tenant (colors, logo, name)
- Feature flags per tenant (enable/disable modules)

**Routing Pattern**:
```
/                           → Landing/auth
/backoffice/                → Super admin dashboard
/t/[slug]/                  → Tenant-specific routes
  ├── /dashboard            → Resident dashboard
  ├── /admin                → Tenant admin dashboard
  └── /onboarding           → New user onboarding
```

### 2.2 Role-Based Access Control (RBAC)

| Role | Access | Screens |
|------|--------|---------|
| **Super Admin** | All tenants, backoffice management | 4 screens |
| **Tenant Admin** | Single tenant, full management | ~25 screens |
| **Resident** | Single tenant, community participation | ~35 screens |

### 2.3 API v1 Architecture

RESTful API at `/api/v1/`:

| Domain | Endpoints | Purpose |
|--------|-----------|---------|
| `/residents` | GET list, GET single | Resident directory |
| `/events` | GET list, GET single, POST rsvp | Event management |
| `/locations` | GET list, GET single | Location data |
| `/exchange` | GET listings | Marketplace |
| `/notifications` | GET list, PATCH read | Notification center |
| `/check-ins` | GET list | Check-in data |

**Features**: Authentication via JWT, pagination, tenant isolation, error handling.

### 2.4 Database Schema (PostgreSQL + PostGIS)

**Core Tables**:
- `tenants` - Multi-tenant foundation
- `users` - Unified user table
- `families` - Household groupings
- `family_members` - User-family relationships
- `locations` - Geographic entities (PostGIS geometry)

**Feature Tables**:
- `events` + `event_attendees` - Event management
- `exchange_listings` + `exchange_transactions` - Marketplace
- `check_ins` - Location-based check-ins
- `requests` - Community help requests
- `announcements` - Admin communications
- `notifications` - Unified notification system

**Security**:
- Row-Level Security (RLS) on all tables
- Tenant isolation via `tenant_id` column
- Visibility scopes: `community`, `neighborhood`, `private`
- Application-level filters for complex visibility logic

---

## 3. Core Features & Functionality

### 3.1 Authentication & Onboarding

**Authentication Methods**:
- Email + Magic Link (passwordless)
- Email + Password
- Invite-only system for new residents

**Onboarding Wizard** (26 components):
- Profile wizard with modal wrapper
- Tour carousel for feature introduction
- Río mascot character (animated sprite)
- Progress indicator
- Step-by-step flow: Welcome → Profile → Family → Journey → Interests → Skills → Complete

### 3.2 Interactive Community Map (Mapbox)

**Technical Implementation**:
- Mapbox GL with React integration
- PostGIS for spatial data storage
- UTM → WGS84 coordinate transformation
- GeoJSON import for complex geometries
- Turf.js for geospatial analysis

**Map Components**:
- `MapboxViewer.tsx` - Main map viewer (119KB)
- `MapboxEditorMap.tsx` - Admin editor with drawing tools (40KB)
- `mapbox-places-autocomplete.tsx` - Location search
- `DrawingToolbar.tsx` - Polygon/line drawing tools
- `EditSidebar.tsx` - Location properties editing

**Map Features**:
- **Location Types**: Lots, amenities, landmarks, protected zones, roads
- **Visualization**: Polygons for lots, markers for amenities, lines for paths
- **Search & Filter**: Mapbox Places autocomplete
- **"View on Map"**: Deep links from events, check-ins, listings
- **Drawing Tools**: Create/edit polygons, lines, markers
- **Admin Tools**: GeoJSON import, manual location creation

### 3.3 Events Management

**Event Creation**:
- Title, description, date/time range
- Location (map integration)
- Category (social, work day, workshop, etc.)
- Max attendees and RSVP deadline
- Visibility (community, neighborhood, private invites)
- Rich text description support

**RSVP System**:
- Status: Going, Maybe, Not Going
- Guest count tracking
- Capacity enforcement
- Waitlist support

**Calendar Integration**:
- List view and calendar view
- Filter by category, date range
- My events view
- 20 event-related files in dashboard

### 3.4 Check-In System

**Purpose**: Real-time social location sharing for community connection

**Features**:
- **Activities**: Coffee, working, exercising, relaxing, eating, etc.
- **Locations**: Official spots or custom map pins
- **Duration**: 30 minutes - 8 hours (auto-expire)
- **Status Updates**: "Working at the cowork space for 2 hours"
- **Map Visualization**: See active check-ins on map
- **Privacy Controls**: Community, neighborhood, or private

### 3.5 Community Exchange (Marketplace)

**Listing Types**:
- For Sale (fixed price)
- For Rent (daily/weekly/monthly rates)
- Free (giveaway)
- Wanted (seeking items)

**Listing Details**:
- Title, description, category (with emoji icons)
- Price and pricing model
- Condition (new, like new, good, fair, poor)
- Photos (up to 10 images via Vercel Blob)
- Location reference
- Expiration date

**Transaction Workflow**:
1. Buyer requests item
2. Seller accepts/rejects
3. Confirmed transaction
4. Pickup coordination
5. Mark as completed

**Components**: 29 files in exchange component folder

### 3.6 Neighbor Discovery (Directory)

**Directory Components** (14 files):
- `ProfileHeroSection.tsx` - Profile header with banner
- `ProfileInfoPanels.tsx` - Tabbed info display
- `ProfileBanner.tsx` - Cover photo/banner
- `ResidentCard.tsx` - Resident preview card
- `FamilyCard.tsx` - Family unit display
- `FamilyMemberCard.tsx` - Individual family member
- `SkillsList.tsx` - Skills display
- `AboutSection.tsx` - Bio/about content
- `ImageLightbox.tsx` - Photo viewer

**Features**:
- Browse all residents
- Search by name, interests, skills
- Filter by family, lot, neighborhood
- View detailed profiles with photo galleries

**Privacy Controls**:
- Hide profile from directory
- Hide contact information
- Hide lot location
- Hide family information

### 3.7 Request System

**Request Types**:
- Maintenance (repairs, improvements)
- Safety (concerns, hazards)
- General (questions, coordination)

**Request Flow**:
1. Resident submits request
2. Admin reviews and assigns
3. Status updates (pending, in progress, resolved, rejected)
4. Communication thread
5. Resolution and feedback

**Components**: 17 files in requests component folder

### 3.8 Announcements

**Admin Communication Tool**:
- Title and rich text content (TipTap editor)
- Tables, links, formatting support
- Priority levels (high, normal, low)
- Expiration dates
- Targeting (all community or specific neighborhoods)
- Draft/published/archived status
- HTML sanitization for security

**Components**: 10 files in announcements component folder

### 3.9 Notifications System

**Notification Types**:
- Event invitations and updates
- RSVP confirmations
- Exchange transaction updates
- Request status changes
- Announcement alerts
- Check-in responses

**Notification Center**:
- Unified inbox
- Mark as read/unread
- Archive notifications
- Click to navigate to source
- Push notifications (via Supabase Realtime)

**Components**: 7 files in notifications component folder

### 3.10 Family Management

**Family Units**:
- Household groupings
- Primary resident designation
- Lot assignment
- Family name and description

**Server Actions**: `families.ts` for family CRUD operations

---

## 4. Mobile Experience

### 4.1 Mobile Dock Navigation

**Implemented**: `MobileDock` component (`components/ecovilla/navigation/mobile-dock.tsx`)

**Features**:
- Fixed bottom navigation bar
- 5 primary actions: Home, Map, Create (elevated), Events, Exchange
- Active state highlighting
- Badge indicators for unread items
- Create popover for quick actions (events, listings, etc.)

**Design**:
- Glassmorphism effect (backdrop blur)
- Rounded floating dock
- 44px+ touch targets
- Design system colors (forest-canopy active, mist-gray inactive)

### 4.2 Mobile Optimizations

- `mobile-zoom-fix.tsx` - Prevents iOS zoom on input focus
- Responsive layouts throughout
- Touch-friendly spacing
- Dev server binds to `0.0.0.0` for device testing

---

## 5. Design & User Experience

### 5.1 Design Philosophy

**Core Values**:
1. **Regenerative by Design** - Interactions energize, not deplete
2. **Belonging Through Inclusivity** - Designed for diverse user types
3. **Nature as North Star** - Visual language rooted in Costa Rican cloud forests
4. **Efficiency with Warmth** - Streamlined without feeling cold
5. **Mindful Transparency** - Users always understand what's happening

### 5.2 Color Palette (Nature-Inspired)

**Primary - Forest Canopy**:
- Deep Forest (#2D5016) - Grounding, stability
- Living Canopy (#4A7C2C) - Primary brand color
- Fresh Growth (#6B9B47) - Success states

**Accent - Sunrise**:
- Sunrise Orange (#D97742) - Community moments, urgent coordination

**Supporting - Sky & Water**:
- River Current (#5B8FA3) - Information, calm

**Neutrals - Earth & Clay**:
- Rich Soil (#1A1A1A) - Primary text
- Weathered Stone (#4A4A4A) - Secondary text
- Morning Mist (#8C8C8C) - Disabled states
- Cloud (#F8F6F3) - Page backgrounds

### 5.3 Component System

**UI Components** (40 files in `components/ui/`):
- Core: Button, Card, Input, Label, Textarea
- Selection: Select, Checkbox, Radio Group, Switch, Multi-Select, Combobox
- Overlay: Dialog, Sheet, Popover, Tooltip, Alert Dialog
- Data: Table, Accordion, Tabs, Carousel
- Feedback: Toast, Skeleton, Spinner
- Rich: Rich Text Editor, Date-Time Picker, Calendar
- Layout: Sidebar, Scroll Area, Separator, Collapsible

**Ecovilla Components** (20 files in `components/ecovilla/`):
- Navigation: Mobile Dock, Create Popover
- Layout: Page containers, sections

**Library Components** (105 files in `components/library/`):
- Reusable patterns and utilities
- Dock component for navigation

---

## 6. Server Actions

| Action File | Size | Purpose |
|-------------|------|---------|
| `events.ts` | 56KB | Event CRUD, RSVP, categories |
| `exchange-listings.ts` | 49KB | Marketplace listings |
| `check-ins.ts` | 31KB | Check-in operations |
| `announcements.ts` | 25KB | Announcement management |
| `exchange-transactions.ts` | 20KB | Transaction workflow |
| `resident-requests.ts` | 10KB | Request handling |
| `exchange-history.ts` | 9KB | Transaction history |
| `locations.ts` | 9KB | Location management |
| `notifications.ts` | 8KB | Notification operations |
| `families.ts` | 7KB | Family management |
| `tenant-features.ts` | 6KB | Feature flags |
| `onboarding.ts` | 4KB | Onboarding state |
| `neighborhoods.ts` | 4KB | Neighborhood data |
| `event-categories.ts` | 3KB | Event categories |
| `privacy-settings.ts` | 3KB | Privacy controls |

---

## 7. Current State Assessment

### 7.1 What's Working Well

✅ **Feature Complete**: All core features implemented  
✅ **Multi-Tenancy**: Solid tenant isolation architecture  
✅ **Modern Stack**: Next.js 16, React 19, TypeScript, Tailwind  
✅ **API v1**: RESTful endpoints with documentation  
✅ **Mobile Navigation**: Dock navigation implemented  
✅ **Rich Text**: TipTap editor with tables, links, formatting  
✅ **Map Consolidated**: Single library (Mapbox)  
✅ **Onboarding**: Comprehensive wizard system  
✅ **Directory**: Detailed profile components  

### 7.2 Code Quality Score: 7.1/10

| Dimension | Score | Notes |
|-----------|-------|-------|
| Architecture | 8/10 | Solid foundation with API v1 |
| Security | 7/10 | RLS, sanitization in place |
| Performance | 6/10 | Map consolidated, some optimization needed |
| Code Quality | 7/10 | Consistent patterns |
| Testing | 3/10 | Storybook only, no unit tests |
| Design | 6/10 | Design system defined, implementation ongoing |
| Mobile UX | 5/10 | Dock implemented, more optimization possible |
| Accessibility | 5/10 | Basic, improving |
| Maintainability | 7/10 | Good organization |

### 7.3 Remaining Technical Debt

1. **Database Migration** - Verify `residents` → `users` migration status
2. **RLS Policy Audit** - Comprehensive security review needed
3. **Automated Testing** - No unit/integration tests
4. **i18n** - English only, no localization
5. **Bundle Size** - Mapbox GL is large (~600KB)

---

## 8. Environment Configuration

### Required Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Vercel Blob (for file uploads)
BLOB_READ_WRITE_TOKEN=your_blob_token

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

---

## 9. Competitive Positioning

### Our Competitive Advantages

1. **Community-First Design**: Built specifically for intentional communities
2. **Geographic Intelligence**: Mapbox with PostGIS, lot assignments, GeoJSON
3. **All-in-One**: Events + Directory + Marketplace + Requests + Map + Check-ins
4. **Multi-Tenant SaaS**: Single platform, many communities
5. **Affordable**: $3/lot/month vs. $100-500/month for enterprise
6. **Modern UX**: Mobile dock navigation, rich text, delightful experience
7. **API Ready**: Foundation for AI assistant and integrations

### Unique Features (vs. Competitors)

| Feature | Ecovilla | WhatsApp | Buildium | Mighty Networks |
|---------|----------|----------|----------|-----------------|
| **Interactive Map** | ✅ Mapbox/PostGIS | ❌ | ❌ | ❌ |
| **Check-Ins** | ✅ | ❌ | ❌ | ❌ |
| **Rich Text Announcements** | ✅ TipTap | ❌ | ✅ | ✅ |
| **Marketplace** | ✅ | ❌ | ✅ | ~ Limited |
| **Mobile Dock Navigation** | ✅ | ✅ | ❌ | ✅ |
| **API v1** | ✅ Documented | ❌ | ✅ | ✅ |
| **Multi-Tenant** | ✅ | ❌ | ✅ | ✅ |
| **Affordable** | ✅ | ✅ | ❌ | ~ |

---

## 10. Roadmap & Future Features

### Planned Enhancements

**1. AI Assistant** 🤖
- Summarize Telegram/WhatsApp groups
- Personalized community updates based on interests
- Natural language queries
- MCP server for app actions

**2. Third-Party Access**
- Visitor Management
- Security Workflows
- Maintenance Teams
- Service Providers
- Integrated payments

**3. Social Connections**
- Friend system
- Friend-only events
- Private messaging
- Enhanced privacy controls

**4. Native Mobile Apps**
- iOS/Android with React Native
- Push notifications
- Camera access
- GPS/location services
- Biometric authentication

---

## 11. Project Structure

```
/
├── app/
│   ├── actions/          # 15 server action files
│   ├── api/v1/           # RESTful API endpoints
│   ├── backoffice/       # Super admin
│   └── t/[slug]/         # Tenant routes
│       ├── admin/        # Tenant admin (~25 screens)
│       ├── dashboard/    # Resident dashboard (~35 screens)
│       └── onboarding/   # Onboarding wizard
├── components/
│   ├── ui/               # 40 shadcn/ui components
│   ├── ecovilla/         # 20 platform components
│   ├── library/          # 105 reusable patterns
│   ├── map/              # 22 Mapbox components
│   ├── onboarding/       # 26 wizard components
│   ├── directory/        # 14 profile components
│   ├── exchange/         # 29 marketplace components
│   └── ...               # Feature-specific components
├── lib/
│   ├── data/             # Data layer modules
│   ├── supabase/         # Supabase clients
│   └── ...               # Utilities
├── PRD/                  # Product documentation
├── design/               # Design specifications
└── storybook-static/     # Component documentation
```

---

## 12. Getting Started

```bash
# Clone repository
git clone <repo-url>
cd v0-community-app-project

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Access at http://localhost:3000
```

---

**Document Version**: 2.0  
**Last Updated**: December 24, 2024  
**Status**: Alpha Ready
