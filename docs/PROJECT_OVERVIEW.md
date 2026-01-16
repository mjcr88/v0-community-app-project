# Project Overview: Community App v0.1

## 1. Introduction
This project is a sophisticated **Next.js** web application designed for comprehensive community management. It features tenant-based routing, role-based access control, and a rich set of interactive features including a marketplace, event management, and advanced mapping capabilities. It is built to stay in sync with v0.app deployments.

## 2. Tech Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with `tailwindcss-animate`
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix UI based)
- **Backend/Auth**: [Supabase](https://supabase.com/) (SSR, Auth, Database)
- **Maps**: 
    - `@react-google-maps/api` & `@vis.gl/react-google-maps` (Google Maps)
    - `react-leaflet` & `leaflet` (OpenStreetMap alternative)
    - `geojson` for spatial data handling
- **State/Data**: Server Actions, `swr`, `react-hook-form`, `zod`
- **Icons**: `lucide-react`
- **Utilities**: `date-fns`, `clsx`, `tailwind-merge`

## 3. Architecture

### 3.1 Tenant-Based Routing
The application uses a multi-tenant architecture where the core application logic lives under `app/t/[slug]/`.
- **`[slug]`**: Represents the community identifier (e.g., `ecovilla-san-mateo`).
- **Global Middleware**: `lib/supabase/middleware.ts` handles session management and auth refreshing.
- **Redirects**: Root `app/page.tsx` redirects to a default tenant login.

### 3.2 Security & Access Control
- **Authentication**: Supabase Auth (Email/Password).
- **Authorization**:
    - **Role-Based**: Users have roles (`resident`, `tenant_admin`, `super_admin`).
    - **Visibility Scopes**: Granular control over content visibility:
        - `community`: Visible to all tenant members.
        - `neighborhood`: Visible only to members of specific neighborhoods (linked via `lots`).
        - `private`: Visible only to specific invitees or family units.
    - **Logic**: `lib/visibility-filter.ts` implements complex application-level security to prevent infinite recursion in RLS policies.

## 4. Core Functional Modules

### 4.1 Community Map & Geolocation
A standout feature is the advanced mapping system (`components/map`).
- **Dual Provider Support**: Supports both Google Maps and Leaflet.
- **Features**:
    - **Custom Locations**: Users can define temporary locations with markers or polygons.
    - **GeoJSON Support**: Upload and preview GeoJSON data (`geojson-preview-map.tsx`).
    - **Editors**: Interactive map editors for drawing shapes and placing pins.
    - **Integration**: Maps are deeply integrated into Events, Check-ins, and Requests.

### 4.2 Events Management
Robust system for community gatherings (`app/actions/events.ts`).
- **Types**: Resident-created vs. Official events.
- **RSVP System**: Track attendance (`yes`, `maybe`, `no`), guests, and capacity limits.
- **Deadlines**: RSVP deadlines and max attendee enforcement.
- **Visibility**: Private invites, neighborhood-exclusive events, or public community events.

### 4.3 Check-Ins
Real-time social location sharing (`app/actions/check-ins.ts`).
- **Activities**: Pre-defined activities (Coffee, Working, Exercise, etc.).
- **Live Tracking**: Duration-based check-ins (30m - 8h) that auto-expire.
- **Locations**: Check in at official community spots or drop a custom pin.
- **Privacy**: Control who sees your check-in (Community, Neighborhood, Private).

### 4.4 Marketplace (Exchange)
A classifieds-style marketplace for residents (`app/actions/exchange-listings.ts`).
- **Listings**: Buy, sell, or give away items.
- **Pricing Models**: Fixed Price, Free, or Exchange/Trade.
- **Conditions**: New, Like New, Good, Fair, Poor.
- **Transactions**: Full workflow from request -> pending -> confirmed -> picked up.
- **Safety**: "Flagging" system for inappropriate content.

### 4.5 Resident Requests
Issue tracking system for maintenance and safety (`app/actions/resident-requests.ts`).
- **Types**: Maintenance, Safety, General.
- **Workflow**: Submit -> Pending -> In Progress -> Resolved/Rejected.
- **Admin Tools**: Admins can reply, add internal notes, and update status.
- **Tagging**: Ability to tag other residents or pets involved in the request.

### 4.6 Announcements
Official communication channel (`app/actions/announcements.ts`).
- **Priority Levels**: High, Normal, Low.
- **Targeting**: Send to entire community or specific neighborhoods.
- **Tracking**: "Read" receipts to track engagement.
- **Lifecycle**: Draft -> Published -> Archived (auto-archive supported).

### 4.7 Notifications
Centralized notification center (`app/actions/notifications.ts`).
- **Types**: Covers all modules (Event invites, Request updates, Announcement alerts).
- **Management**: Mark as read, archive, and batch operations.
- **Real-time**: Integrated with Supabase for immediate updates.

## 5. Data Schema & Security

### 5.1 Core Entities
- **Tenants (`tenants`)**: The top-level isolation unit. All major entities (`users`, `residents`, `events`, etc.) are scoped to a `tenant_id`.
- **Users (`users`)**: Custom user profile table linked to Supabase Auth. Stores `role` (`resident`, `tenant_admin`, `super_admin`) and `tenant_id`.
- **Residents (`residents`)**: Detailed profile for a resident, linked to a `user` and a `lot`.
- **Lots (`lots`)**: Physical properties within a neighborhood. Linked to `neighborhoods`.
- **Neighborhoods (`neighborhoods`)**: Logical grouping of lots. Used for targeted visibility.
- **Family Units (`family_units`)**: Groups residents together.
- **Pets (`pets`)**: Linked to `family_units` and `lots`.

### 5.2 Feature Entities
- **Locations (`locations`)**:
    - **Types**: `facility` (point), `lot` (polygon), `walking_path` (linestring).
    - **Data**: Stores GeoJSON-compatible coordinates/boundaries.
- **Events (`events`)**:
    - **Relations**: `event_rsvps` (attendance), `event_invites` (private access), `event_neighborhoods` (visibility).
    - **Logic**: Complex visibility rules handled by `lib/visibility-filter.ts` to avoid RLS recursion.
- **Check-ins (`check_ins`)**:
    - **Relations**: `check_in_rsvps`, `check_in_invites`.
    - **Expiration**: Auto-expire logic handled via SQL/Cron.
- **Exchange (`exchange_listings`)**:
    - **Relations**: `exchange_transactions` (state machine for buy/sell), `exchange_neighborhoods`.
- **Requests (`resident_requests`)**:
    - **Relations**: Can tag `residents` and `pets`.
- **Notifications (`notifications`)**:
    - **Unified Table**: Polymorphic design linking to `events`, `exchange_transactions`, etc.
    - **Status**: Tracks `is_read`, `action_required`, `action_taken`.

### 5.3 Security Model (RLS)
- **Strategy**: "Tenant Isolation + Role-Based Access".
- **Common Pattern**: Most policies check `tenant_id` AND `role`.
    - *Admins*: Full access within their tenant.
    - *Residents*: Read access to shared data; Write access to their own data.
- **Visibility Scopes**:
    - `community`: Public to tenant.
    - `neighborhood`: Checked against `users -> residents -> lots -> neighborhood_id`.
    - `private`: Checked against `invites` tables.
- **Note**: Complex recursive logic (e.g., "Can I see this event?") is often offloaded to application-level helpers (`lib/visibility-filter.ts`) to prevent database performance issues.

## 6. Data Model Highlights
- **Users & Residents**: Users are linked to `residents`, which are linked to `lots` and `family_units`.
- **Neighborhoods**: Logical grouping of `lots` for targeted visibility.
- **Pets**: First-class citizens in the data model, linkable to requests.

## 7. UI/UX Patterns
- **Design System**: Comprehensive usage of **Shadcn UI** components (`components/ui`).
- **Responsive**: Mobile-first design with `Sidebar` layouts for navigation.
- **Feedback**: Extensive use of `sonner` toasts and `alert-dialogs` for user confirmation.
- **Forms**: `react-hook-form` with `zod` validation for robust data entry.

## 8. Getting Started
1.  **Environment**: Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2.  **Install**: `npm install` or `pnpm install`.
3.  **Run**: `npm run dev` to start the development server.
4.  **Access**: Navigate to `http://localhost:3000` (redirects to login).
