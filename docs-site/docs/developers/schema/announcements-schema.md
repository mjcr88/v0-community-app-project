# Announcements Schema

The announcements module handles community-wide or neighborhood-specific communications from tenant admins to residents.

## Tables

### 1. `announcements`
The core table storing the announcement content, metadata, and targeting information.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `tenant_id` | `uuid` | The tenant this announcement belongs to |
| `created_by` | `uuid` | References `users.id`. The admin who created it. |
| `title` | `text` | Main headline of the announcement |
| `description` | `text` | Optional rich text body content |
| `announcement_type` | `enum` | Categorization: `general`, `emergency`, `maintenance`, `event`, `policy`, `safety`, `alert`, `community_update`, `resource` |
| `priority` | `enum` | Importance level: `normal`, `important`, `urgent` |
| `status` | `enum` | Lifecycle state: `draft`, `published`, `archived`, `deleted` |
| `event_id` | `uuid` | Optional reference to an `events.id` |
| `location_type` | `text` | Optional: `community_location` or `custom_temporary` |
| `location_id` | `uuid` | Optional reference to `locations.id` |
| `images` | `text[]` | Array of image URLs |
| `auto_archive_date` | `timestamp` | Optional date when the announcement should be automatically moved to `archived` status by cron job |
| `published_at` | `timestamp` | When status changed to published |
| `archived_at` | `timestamp` | When status changed to archived |
| `last_edited_at` | `timestamp` | When content was modified *after* publication |
| `created_at` | `timestamp` | Record creation time |
| `updated_at` | `timestamp` | Record update time |

### 2. `announcement_neighborhoods`
Join table used for targeting announcements to specific neighborhoods instead of the whole community (tenant).

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary Key |
| `announcement_id` | `uuid` | Reference to `announcements.id` |
| `neighborhood_id` | `uuid` | Reference to `neighborhoods.id` |

*Note: If an announcement has NO entries here, it is considered "Community-Wide".*

### 3. `announcement_reads`
Tracking table to monitor which users have seen which announcements. Powers the "Unread" notification badges.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary Key |
| `announcement_id` | `uuid` | Reference to `announcements.id` |
| `user_id` | `uuid` | Reference to `users.id` |
| `read_at` | `timestamp` | When the user viewed the announcement |

## Row Level Security (RLS) Policies

### `announcements`
- **Admins (Super & Tenant):** Can `SELECT`, `INSERT`, `UPDATE`, `DELETE` announcements within their tenant.
- **Residents:** Can `SELECT` announcements that are:
  - In their `tenant_id`.
  - Have a `status` of `published` or `archived` (cannot view `draft` or `deleted`).
  - EITHER have no specific neighborhood targeting (community-wide) OR are targeted to the resident's specific neighborhood (via their `lot_id` -> `neighborhood_id`). *Note: This filtering logic is currently handled heavily in the application layer (`app/actions/announcements.ts`), but standard RLS restricts cross-tenant access.*

### `announcement_reads`
- **Users:** Can `INSERT` (upsert) records linking their `user_id` to an `announcement_id` to mark it as read. Can `SELECT` their own read records.
- **Admins:** Can `SELECT` all read records for announcements in their tenant to monitor engagement.

### `announcement_neighborhoods`
- **Admins:** Can `INSERT`, `UPDATE`, `DELETE` within their tenant.
- **Residents:** Can `SELECT` to determine routing/visibility.
