# Ecovilla Community Platform

**Multi-tenant SaaS for community management**  
**Status**: Alpha Ready | **Version**: 0.1.0

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment (see Environment Variables below)
cp .env.example .env.local

# Run development server (accessible from mobile devices)
npm run dev

# Access at http://localhost:3000
```

---

## Project Overview

A comprehensive community management platform for eco-villages, HOAs, and intentional communities. Features include:

- **Interactive Maps** (Mapbox with PostGIS)
- **Events & RSVP** with calendar views
- **Community Marketplace** for listings and transactions
- **Neighbor Directory** with rich profiles
- **Check-In System** for location sharing
- **Request Management** for maintenance/safety
- **Announcements** with rich text (TipTap)
- **Real-time Notifications**

### Multi-Tenancy

Each community is isolated at the database level:
- Unique slugs: `/t/ecovilla-san-mateo`
- Row-Level Security (RLS)
- Per-tenant feature flags and branding

### User Roles

| Role | Access |
|------|--------|
| Super Admin | All tenants, backoffice |
| Tenant Admin | Single tenant management |
| Resident | Community participation |

---

## Tech Stack

### Core
- **Next.js** ^16.0.10 (App Router)
- **React** ^19.2.1
- **TypeScript** 5.x
- **Tailwind CSS** 4.1.9
- **shadcn/ui** (40 components)

### Backend
- **Supabase** (PostgreSQL, Auth, Realtime, Storage)
- **Vercel** (Hosting, Serverless)
- **Upstash Redis** (Rate limiting)

### Maps
- **Mapbox GL** ^2.15.0
- **react-map-gl** ^7.1.7
- **@turf/turf** (Geospatial analysis)

### Rich Text
- **TipTap** ^3.13.0 (Tables, links, formatting)
- **DOMPurify** (HTML sanitization)

---

## Project Structure

```
app/
├── actions/              # Server actions (15 files)
├── api/v1/               # RESTful API endpoints
│   ├── residents/
│   ├── events/
│   ├── locations/
│   ├── exchange/
│   ├── notifications/
│   └── check-ins/
├── backoffice/           # Super admin
└── t/[slug]/             # Tenant routes
    ├── admin/            # Tenant admin
    ├── dashboard/        # Resident dashboard
    └── onboarding/       # Profile wizard

components/
├── ui/                   # 40 shadcn components
├── ecovilla/             # Platform components (navigation, etc.)
├── map/                  # Mapbox components
├── onboarding/           # Wizard components (26 files)
├── directory/            # Profile components (14 files)
├── exchange/             # Marketplace (29 files)
├── events/               # Event components
├── announcements/        # Announcement components
├── requests/             # Request components (17 files)
└── library/              # Reusable patterns (105 files)

lib/
├── data/                 # Data layer modules
├── supabase/             # Supabase clients
├── mapbox-geocoding.ts   # Location search
├── sanitize-html.ts      # HTML sanitization
└── ...                   # Utilities
```

---

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=

# File uploads
BLOB_READ_WRITE_TOKEN=

# Rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## API v1

All endpoints require authentication via Supabase JWT.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/residents` | GET | List residents |
| `/api/v1/residents/:id` | GET | Get resident |
| `/api/v1/events` | GET | List events |
| `/api/v1/events/:id` | GET | Get event |
| `/api/v1/events/:id/rsvp` | POST | RSVP to event |
| `/api/v1/locations` | GET | List locations |
| `/api/v1/exchange/listings` | GET | List marketplace |
| `/api/v1/notifications` | GET | List notifications |
| `/api/v1/notifications/:id/read` | PATCH | Mark as read |
| `/api/v1/check-ins` | GET | List check-ins |

See `app/api/v1/README.md` for full documentation.

---

## Key Components

### Mobile Dock
```tsx
// components/ecovilla/navigation/mobile-dock.tsx
<MobileDock tenantSlug={slug} tenantId={id} ... />
```
Fixed bottom navigation: Home, Map, Create, Events, Exchange

### Map Viewer
```tsx
// components/map/MapboxViewer.tsx
<MapboxViewer locations={locations} tenantId={id} ... />
```

### Rich Text Editor
```tsx
// components/ui/rich-text-editor.tsx
<RichTextEditor value={content} onChange={setContent} />
```

---

## Server Actions

| File | Purpose |
|------|---------|
| `events.ts` | Event CRUD, RSVP |
| `exchange-listings.ts` | Marketplace |
| `check-ins.ts` | Check-in operations |
| `announcements.ts` | Admin announcements |
| `families.ts` | Family management |
| `notifications.ts` | Notification ops |
| `privacy-settings.ts` | Privacy controls |
| `onboarding.ts` | Onboarding state |

---

## Database Schema

**Core**: `tenants`, `users`, `families`, `family_members`, `locations`

**Features**: `events`, `event_attendees`, `exchange_listings`, `exchange_transactions`, `check_ins`, `requests`, `announcements`, `notifications`

All tables use:
- `tenant_id` for isolation
- RLS policies for security
- Soft deletes via status columns

---

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build

# Storybook (component docs)
# See storybook-static/ for built stories
```

### Testing from Mobile
Dev server binds to `0.0.0.0`, access via local IP:
```
http://192.168.x.x:3000
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| `CURRENT_STATE_OVERVIEW.md` | Full platform overview |
| `CURRENT_STATE_GAP_ANALYSIS.md` | Progress analysis |
| `app/api/v1/README.md` | API documentation |
| `PRD/prd_v0.5.md` | Product requirements |
| `design/design_specification.md` | Design tokens |

---

## Deployment

**Production**: Vercel (auto-deploy from `main`)  
**Preview**: Vercel preview deployments on PRs

---

**Last Updated**: December 2024
