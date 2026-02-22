# API Reference

*Note: This reference documents internal server actions used by Server Components and Client Components in Next.js.*

## Announcements Module
Located at `app/actions/announcements.ts`

### `createAnnouncement`
Creates a new announcement and automatically notifies targeted residents if published immediately.

**Parameters:**
- `tenantSlug: string` - The unique URL identifier for the tenant.
- `tenantId: string` - The UUID of the tenant.
- `data: CreateAnnouncementData` - Payload containing title, type, priority, status, auto-archive date, and optional location/event links. Can include `neighborhood_ids` array to target specific subsections of the community.

**Returns:** 
- `{ success: true, data: Announcement }` OR `{ success: false, error: string }`

**Access Control:** Tenant Admins or Super Admins only.

---

### `updateAnnouncement`
Modifies an existing announcement. If the announcement goes from `draft` to `published`, it will trigger initial notifications. If already published, it updates the `last_edited_at` timestamp and triggers "update" notifications.

**Parameters:**
- `announcementId: string` - The UUID of the announcement to update.
- `tenantSlug: string` - The unique URL identifier for the tenant.
- `tenantId: string` - The UUID of the tenant.
- `data: Partial<CreateAnnouncementData>` - Fields to update.

**Returns:** 
- `{ success: true, data: Announcement }` OR `{ success: false, error: string }`

**Access Control:** Tenant Admins or Super Admins only.

---

### `publishAnnouncement`
Dedicated action to transition a draft announcement to `published` status.

**Parameters:**
- `announcementId: string` - The UUID of the announcement.
- `tenantSlug: string` - The unique URL identifier for the tenant.
- `tenantId: string` - The UUID of the tenant.

**Returns:** 
- `{ success: true }` OR `{ success: false, error: string }`

**Access Control:** Tenant Admins or Super Admins only.

---

### `archiveAnnouncement`
Dedicated action to manually transition an announcement to `archived` status (Hides it from main feed).

**Parameters:**
- `announcementId: string` - The UUID of the announcement.
- `tenantSlug: string` - The unique URL identifier for the tenant.
- `tenantId: string` - The UUID of the tenant.

**Returns:** 
- `{ success: true }` OR `{ success: false, error: string }`

**Access Control:** Tenant Admins or Super Admins only.

---

### `deleteAnnouncement`
Permanently destroys the announcement record (Hard delete).

**Parameters:**
- `announcementId: string` - The UUID of the announcement.
- `tenantSlug: string` - The unique URL identifier for the tenant.
- `tenantId: string` - The UUID of the tenant.

**Returns:** 
- `{ success: true }` OR `{ success: false, error: string }`

**Access Control:** Tenant Admins or Super Admins only.

---

### `getAnnouncements`
Fetches announcements for a resident, adhering to visibility and targeting rules.

**Parameters:**
- `tenantId: string` - The UUID of the tenant.
- `userId: string` - The UUID (auth.users) of the requesting user.
- `filters?: { status?: "active" | "read" | "archived", limit?: number }` - Optional filters.

**Returns:** 
- `{ success: true, data: AnnouncementWithRelations[] }` OR `{ success: false, error: string }`

**Logic Details:**
This method performs complex in-memory filtering because RLS alone cannot cleanly handle the array-intersection logic required for `announcement_neighborhoods`. It automatically filters out announcements targeted to neighborhoods the user does not belong to. It maps an `is_read` boolean derived from the `announcement_reads` table mapping to the user.

**Access Control:** Residents in the tenant.

---

### `getAllAnnouncementsAdmin`
Fetches a comprehensive, unfiltered list of all announcements for admin management tables.

**Parameters:**
- `tenantId: string` - The UUID of the tenant.
- `filters?: { status?: string, type?: string, priority?: string, search?: string }` - Filter criteria.

**Returns:** 
- `{ success: true, data: AnnouncementWithRelations[] }` OR `{ success: false, error: string }`

**Access Control:** Admin roles only. (No neighborhood filtering applied).

---

### `markAnnouncementAsRead`
Upserts a record into `announcement_reads` to acknowledge the resident has seen the announcement.

**Parameters:**
- `announcementId: string` - The UUID of the announcement to mark read.
- `tenantSlug: string` - Used to trigger `revalidatePath` to clear the unread badge cache.

**Returns:** 
- `{ success: true }` OR `{ success: false, error: string }`

**Access Control:** Authenticated Users.

---

### `getUnreadAnnouncementsCount`
Calculates the number of active, published announcements the user has not explicitly read.

**Parameters:**
- `tenantId: string` - The UUID of the tenant.
- `userId: string` - The UUID (auth.users) of the requesting user.

**Returns:** 
- `number | undefined`

**Logic Details:**
Used strictly for populating the red notification badge on the Dashboard sidebar navigation. Returns `undefined` if zero to prevent rendering a "0" badge.
