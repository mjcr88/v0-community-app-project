# Implementation Plan: Alpha Release

| Metadata | Details |
| :--- | :--- |
| **Target** | 10-20 alpha testers (residents + 1 admin) |
| **Timeline** | 2 weeks |
| **Languages** | English + Spanish |

## Units Overview

| Unit | Name | Tier | Effort | Status |
| :--- | :--- | :--- | :--- | :--- |
| **0** | Simple i18n Infrastructure | T1 | 1 day | ✅ Complete (with caveats) |
| **1** | Fix Facility Details | T1 | 0.5 day | ✅ Complete |
| **2** | Supabase Storage Migration + Document Library | T1 | 4-5 days | ✅ Complete |
| **2C** | Document Library Feature Toggle | T1 | 0.5 day | ✅ Complete |
| **2D** | Documents in Priority Feed & Notifications | T1 | 1 day | ✅ Complete |
| **3** | Family Member Creation | T1 | 2-3 days | ✅ Complete |
| **4** | Neighbor Lists | T2 | 3-4 days | ✅ Complete |
| **5** | Admin Facility Management + Reservations | T2 | 5-6 days | ✅ Complete |
| **6** | Recurring Events | T3 | 2-3 days | ⏳ Not Started |
| **7** | Vercel Blob Cleanup | Post | 0.5 day | ✅ Complete |
| **8** | Resident Page Translations | Post | 2-3 days | ⏳ Not Started |
| **9** | Family Member Creation RLS Fix | T1 | 0.1 day | ✅ Complete |
| **10** | Family Management UI Polish | T1 | 0.3 day | ✅ Complete |

---

## Unit 0: Simple i18n Infrastructure ✅
**Status:** Complete (with performance caveats)

### What Was Done
- [x] Created `lib/i18n/` directory structure
- [x] Created EN/ES JSON translation files with common strings
- [x] Created `LanguageProvider` context with `useTranslation()` hook
- [x] Added language toggle to navigation hamburger menu
- [x] Language preference persists in `localStorage`

### Caveats / Known Issues
> [!WARNING]
> The `LanguageProvider` causes severe performance issues when wrapping server components (60s+ timeouts).

**Workarounds:**
*   **Login Page:** `LanguageProvider` removed. Page loads in ~0.4s but translations are inactive.
*   **Dashboard:** `LanguageProvider` moved to client-side `DashboardLayoutClient`. i18n works properly here.

**Outstanding Item:**
- [ ] Translate remaining common strings (low priority for alpha)

---

## Unit 1: Fix Facility Details ✅
**Status:** Complete

### What Was Done
- [x] Investigated missing fields in `FacilityFields.tsx` and `LocationInfoCard`
- [x] Fixed admin form to properly save all facility fields (capacity, hours, amenities, parking, etc.)
- [x] Improved map preview UI: replaced hardcoded sidebar with reusable `LocationInfoCard`
- [x] Added embedded variant to `LocationInfoCard` for cleaner sidebar integration
- [x] Fixed location detail link navigation (via `LocationInfoCard` redirect)
- [x] Refined Resident Map sidebar (removed extra box/shadow)
- [x] Admin Map UI verified as functional
- [x] Priority feed now correctly excludes read announcements (filtered client-side)

### Key Changes
| File | Change |
| :--- | :--- |
| `LocationInfoCard.tsx` | Added variant prop (`"default"` \| `"embedded"`) for flexible styling |
| `resident-map-client.tsx` | Uses embedded variant, cleaner sidebar |
| `MapboxFullViewer.tsx` | Uses embedded variant in admin sidebar |

---

## Unit 2: Supabase Storage Migration + Document Library ✅
**Status:** Complete

### 2A: Storage Migration ✅
**Status:** Complete

**What Was Done:**
- [x] Migrated upload logic to Supabase Storage
- [x] Migrated all existing Vercel Blob files to Supabase buckets
- [x] Removed Vercel Blob dependency

**Purpose:** Move from Vercel Blob to Supabase Storage for cost control and data consolidation.

**Current State:**
All uploads go through `/api/upload` → Vercel Blob. Used by: `photo-manager`, profile forms, identity step, event images, listing images.

**Files Modified:**
- [x] `app/api/upload/route.ts`: Switch from `@vercel/blob` to Supabase Storage
- [x] `app/api/upload/delete/route.ts`: Switch delete to Supabase Storage
- [x] [NEW] `lib/supabase-storage.ts`: Wrapper functions for upload/delete

**Acceptance Criteria:**
- [x] Existing upload functionality works with Supabase
- [x] All form components continue to work
- [x] Delete functionality works

### 2B: Document Library ✅
**Status:** Complete

**Purpose:** Admins can create official documents (rich text pages with optional images, or PDFs) for residents to access.

**Document Types:**
| Type | Description |
| :--- | :--- |
| **Rich Text Document** | Full page with formatted content, optional images |
| **PDF Document** | Uploaded PDF file with title and description |

**Categories:**
| Category | Emoji |
| :--- | :--- |
| Regulation | 📋 |
| Financial | 💰 |
| Construction | 🏗️ |
| HOA | 🏠 |

**Navigation Changes:** Resident Side: "Announcements" → "Official" (tab layout with Announcements + Documents)

**Acceptance Criteria:**
- [x] Admin can create rich text document with image
- [x] Admin can upload PDF document
- [x] Changelog prompt appears on edit
- [x] Residents see "Official" nav item
- [x] Residents can filter documents by category
- [x] History accordion shows changelog entries
- [x] PDFs can be downloaded
- [x] Mobile tabs refined (responsive text/padding)
- [x] "Read" status tracking implemented
- [x] Rio mascot empty states added

**Completion Notes:**
*   Implemented "Official" page combining Announcements and Documents.
*   Created `DocumentListClient` with search, category filtering, and "New/Read/Archived" tabs.
*   Added `document_reads` table for tracking viewed documents.
*   Fixed mobile layout issues by making tabs responsive (smaller text/padding on mobile).
*   Fixed RLS policies for `tenant_admin` role.
*   Added Rio mascot to empty states for consistency.

### 2C: Document Library Feature Toggle ✅
**Status:** Complete

**Purpose:** Add a `documents_enabled` toggle to the tenants table to allow superadmins (via the backoffice) to enable/disable the Document Library feature per tenant.

**Proposed Changes:**
*   **Database Migration:** `ALTER TABLE tenants ADD COLUMN documents_enabled BOOLEAN DEFAULT true;`

**Files Modified:**
- [x] `scripts/059_add_documents_enabled.sql`: Migration to add column
- [x] `tenant-features-form.tsx`: Added documents feature toggle
- [x] `official-tabs.tsx`: Added `documentsEnabled` prop
- [x] `official/page.tsx`: Fetch and pass `documents_enabled` flag

**Acceptance Criteria:**
- [x] Add `documents_enabled` column to tenants table (migration)
- [x] Update TypeScript types (in `tenant-features-form.tsx`)
- [x] Conditionally hide Documents tab when disabled
- [x] Superadmin can toggle feature in backoffice tenant settings

### 2D: Documents in Priority Feed & Notifications ✅
**Status:** Complete

**What Was Done:**
- [x] **Priority Feed API:** Integrated unread, published documents into `priority/route.ts` with a base score of 95 (+5 for featured docs).
- [x] **UI Component:** Updated `PriorityFeed.tsx` with document icon (`FileText`), color themes, and direct "Read Document" actions.
- [x] **Notification Triggers:** Added logic to `documents.ts` to notify all residents when a document is published or updated.
- [x] **Notification Infrastructure:** Added `document_id` support to the database, notification fetching actions, and UI filtering in the notification center.
- [x] **Reappearance Logic:** Implemented a "clear read status on update" mechanism to ensure modified documents reappear in residents' priority feeds.

**Purpose:** Newly published documents should appear in the Priority Feed and trigger notifications.

**Acceptance Criteria:**
- [x] Add document type to Priority Feed API with score 95
- [x] Filter documents by unread status (using `document_reads`)
- [x] Show featured documents with +5 priority boost
- [x] Limit to documents published within last 30 days
- [x] Create notification on document publish
- [x] Add `document_published` and `document_updated` notification types
- [x] Add document notification card rendering in `PriorityFeed.tsx`
- [x] Reset read status on document update to ensure feed reappearance

**Files Modified:**
- [x] `priority/route.ts`: Added documents query with scoring and unread filtering
- [x] `PriorityFeed.tsx`: Added document rendering and action buttons
- [x] `documents.ts`: Added notification triggers and read-status reset logic
- [x] `notifications.ts` (types/actions): Added `document_id` and new types support
- [x] `notification-utils.ts`: Added title/URL generation for documents
- [x] `notifications` table: Added `document_id` column (Migration)

---

## Unit 3: Family Member Creation ✅
**Status:** Complete

**Purpose:** Primary contact of a family can add family members to their household.

### Data Model Strategy (Unified Users)
*   **Unified Table:** `public.users` stores both Active and Passive members.
*   **Passive Members:** `public.users` row with `email = NULL` and no `auth.users` link.
*   **Active Members:** `public.users` row linked to `auth.users` via `id`.
*   **Migration:** Make `public.users.email` Nullable.

**Account Types:**
| Type | Description | Data Structure |
| :--- | :--- | :--- |
| **Active** | Full app access | `users` row with email + `auth.users` record |
| **Passive** | Directory-only | `users` row with `email = NULL` |

**Acceptance Criteria:**
- [x] Schema: Make `users.email` nullable
- [x] UI: "Add Member" form in Family Settings
- [x] Action: `createFamilyMember` supports passive creation
- [x] UI: Passive members appear in family list
- [x] Feature: "Request App Access" button for passive members
- [x] Feature: Admin sees "Account Access" requests
- [x] Feature: Email saved to passive account on access request
- [x] Feature: "Passive" badge shown in admin residents list
- [x] Admin Action: Approve Request -> Use existing "Send Invite" button

**Completion Notes:**
*   **Schema:** Created migration to make `users.email` nullable (Migration 055).
*   **UI:** Updated `FamilyManagementForm` with "Create New Member" tab.
*   **Backend:** Created `createFamilyMember` action with service role client.
*   **Requests:** Implemented `requestAccountAccess` action.
*   **Admin:** Updated Admin Request Dashboard to handle `account_access` type.
*   **Admin UI:** Added "Passive" badge (amber) in residents table.
*   **Admin Approval:** Uses existing "Send Invite" button in `edit-resident-form.tsx`.

---

## Unit 4: Neighbor Lists ✅
**Status:** Complete

**Purpose:** Residents can create custom lists of neighbors for organizing contacts and targeting invitations.

**Key Decisions:**
*   ❌ No bidirectional connections
*   ✅ Lists only - simple personal organization
*   ✅ Lists can be shared with family members
*   ✅ Shared lists are editable by family members
*   ✅ Passive members cannot be added to lists
*   ✅ Feature toggle: `neighbor_lists_enabled` per tenant

**Limits:**
*   Maximum 25 lists per user
*   Maximum 250 members per list

### Data Model
**Tables:**
*   `neighbor_lists`: `id`, `tenant_id`, `owner_id`, `name`, `emoji`, `description`, `is_shared`, `created_at`, `updated_at`
*   `neighbor_list_members`: `id`, `list_id`, `neighbor_id`, `added_at`, `added_by`

**RLS:**
*   Users can CRUD their own lists
*   Family members can CRUD shared lists
*   Members table follows list ownership

### UI Components
*   Directory Page - "My Lists" Tab
*   Add to List Button
*   List Detail Modal (Slide-over)
*   Emoji Picker

**Acceptance Criteria:**
- [x] Create list with name + emoji + description
- [x] Edit list (name, emoji, description, shared toggle)
- [x] Delete list (with confirmation)
- [x] Add neighbors to lists from directory cards/profile page
- [x] Remove neighbors from lists
- [x] "My Lists" tab in directory with `ListCard` components
- [x] `ListDetailModal` (Sheet) with resident search
- [x] Multi-list selection when adding neighbor
- [x] Storybook: Create stories for new components

**Completion Notes:**
- [x] Implemented `FriendsGoingBadge` component
- [x] Added `enrichWithAttendeeIds` to events data layer
- [x] Fixed Priority Feed to include RSVP status and visibility filtering
- [x] Fixed Check-ins API to show private check-ins to invited users
- [x] Updated `ResidentInviteSelector` with "My Lists" tab

---

## Unit 5: Admin Facility Management + Reservations ✅
**Status:** Complete

### 5A: Admin Facility Management ✅
**Route:** `/t/[slug]/admin/facilities`
**Status:** Complete

**Purpose:** Admins need a dedicated page to manage facilities and their reservation settings.

**Acceptance Criteria:**
- [x] Admin navigation item "Facilities" added
- [x] List view of all locations with `type='facility'` (similar to Residents/Events tables)
- [x] Admin can edit facility details (capacity, hours, amenities)
- [x] Admin can toggle `is_reservable` status (new DB column)
- [x] "Reservations" tab in Facility Detail view showing active bookings

### 5B: Reservations ✅
**Status:** Complete (MVP)

**Purpose:** Residents can reserve time slots at reservable facilities.

**Database Schema (reservations):**
*   `id` (uuid, PK)
*   `tenant_id` (uuid)
*   `location_id` (uuid, FK to locations)
*   `user_id` (uuid, FK to users)
*   `start_time` (timestamptz)
*   `end_time` (timestamptz)
*   `status` (text: 'confirmed', 'cancelled', 'rejected')
*   `created_at` (timestamptz)
*   `cancellation_reason` (text, nullable)

**Constraints & Logic:**
*   **Approvals:** Auto-confirmed if slot is free.
*   **Limits:** Max 2 hours per slot, Max 2 active reservations per resident.
*   **Conflict:** No overlapping slots for the same location.
*   **Buffer:** None required.

**User Interface:**
*   **Resident:**
    *   "Reserve" button on Location Detail page.
    *   "Reserve" button on Map Facility Preview Sidebar.
*   **Admin:**
    *   New Page: `/t/[slug]/admin/reservations`
    *   View all active reservations.
    *   Cancel/Reject action with specific reason input.

**Notifications & Priority Feed:**
*   **Triggers:** Reminder (24h before), Cancellation (sent to creator).
*   **Feed Score:** 95 (High priority) for upcoming reservations within 24h.

**Files to Modify/Create:**
- [x] `app/actions/calendar/reservations.ts`: Server actions for CRUD & validation
- [x] `app/api/dashboard/priority/route.ts`: Add reservation reminders logic
- [x] `components/facilities/reservation-form.tsx`: New component for booking UI
- [x] `app/t/[slug]/admin/facilities/page.tsx`: Admin Facilities list page
- [x] `app/t/[slug]/admin/reservations/page.tsx`: Admin Reservations management page

### 5C: Debugging & Finalization Updates ✅
**Status:** Complete

**Objective:** Fix reservation creation bug, UI visibility issues, and accessibility warnings.

**Work Done:**
1.  **Fix 500 Error on Reservation Creation:** Updated `createNotification` to use `recipient_id`.
2.  **Fix Accessibility Warnings:** Added `DialogDescription` to `ReservationForm`.

### 5D: Refinement & UI Polish ✅
**Status:** Complete

**Objective:** Ensure the reservation system feels native, responsive, and robust.

**Work Done:**
1.  **Sidebar "Reserve" Button:** Added button to `location-info-card.tsx` enabled variant.
2.  **Dashboard Widget Logic & Styling:** Updated `MyReservationsWidget` to match requests style. Badge now reflects active count.
3.  **Enhance Location Details Page:** Added `UpcomingReservations` section (Server Component).

### 5E: Admin Reservations Page ✅
**Status:** Complete

**Objective:** Admin interface for managing reservations.

**Work Done:**
- [x] Created `/t/[slug]/admin/reservations/page.tsx`
- [x] Implemented `AdminReservationsTable`
- [x] Added `CancelReservationDialog` with reason support
- [x] Wired up Admin Sidebar link

### 5F: Reservations Feature Toggle ✅
**Status:** Complete

**Objective:** Allow toggling reservations per tenant.

**Work Done:**
- [x] Added `reservations_enabled` to Tenant configuration
- [x] Updated Admin Sidebar to hide disabled link
- [x] Updated Dashboard Widget to hide if disabled
- [x] Updated Location Details to check feature flag
- [x] Enforced flag check in `createReservation` server action

---

## Unit 6: Recurring Events
**Status:** In Progress
**Period:** Week 2 (Friday)

**Purpose:**
Create events that repeat on a schedule (Daily, Weekly, Monthly) with a "Generate on Save" model.

**User Decisions:**
- **Generation Limit:** Max 12 instances per series (hard limit).
- **Edit Behavior:** "Edit Future" (updates apply to future instances only).
- **RSVPs:** Per-instance.
- **Exceptions:** Stay linked to parent series.

**Acceptance Criteria:**
- [ ] DB: `parent_event_id` and `recurrence_rule` columns added
- [ ] UI: "Repeat" toggle in Event Form Step 1
- [ ] UI: Frequency options (Daily, Weekly, Monthly) & End conditions
- [ ] Backend: Loop generation of child events (Max 12)
- [ ] Validation: Start Date + Recurrence <= 1 Year

---

## Unit 7: Vercel Blob Cleanup (Post-Launch) ✅
**Status:** Complete

**Purpose:** After confirming Supabase storage works, remove Vercel Blob references.

**What Was Done:**
- [x] Deleted `@vercel/blob` from `package.json`
- [x] Ran migration script to move existing blobs
- [x] Removed old import statements

---

## Unit 8: Resident Page Translations (Post-Launch) ⏳
**Status:** Not Started

**Purpose:** Create complete EN/ES translations for all resident-facing pages.

**Scope:** All pages under `/t/[slug]/dashboard/` and shared components.

**Acceptance Criteria:**
- [ ] All resident pages use translation keys
- [ ] EN JSON complete
- [ ] ES JSON complete
- [ ] No hardcoded English in resident UI

---

## Unit 9: Family Member Creation RLS Fix ✅
**Status:** Complete

**Purpose:** Fix RLS violation when residents attempt to add family members to their household.

**What Was Done:**
- [x] Created RLS policy `residents_insert_family_members` (Migration 058)
- [x] Switched `createFamilyMember` action to use service role client
- [x] Permission checks validated before insert

---

## Unit 10: Family Management UI Polish ✅
**Status:** Complete

**Purpose:** Fix UI issues discovered during family member creation testing.

**What Was Done:**
- [x] Added RLS DELETE policy for pets
- [x] Fixed relationship dropdown alignment
- [x] Added avatar upload for passive family members

---

## Sprint Schedule

**Week 1: Foundation (Completed)**
| Day | Unit | Deliverables | Status |
| :--- | :--- | :--- | :--- |
| **1 (Mon)** | 0, 1 | i18n setup, facility details fix | ✅ Done |
| **2 (Tue)** | 2A | Supabase storage migration | ✅ Done |
| **3-4** | 2B | Document library + official section | ✅ Done |
| **5 (Fri)** | 3 | Family member creation | ✅ Done |

**Week 2: Features**
| Day | Unit | Deliverables | Status |
| :--- | :--- | :--- | :--- |
| **1 (Mon)** | 4 | Neighbor lists in directory | ✅ Done |
| **2 (Tue)** | 4 | Lists in event/check-in forms | ✅ Done |
| **3 (Wed)** | 5 | Admin facility management page | ✅ Done |
| **4-5** | 5 | Reservations MVP & Polish | ✅ Done |
| **5 (Fri)** | 6 | Recurring events | ⏳ Not Started |