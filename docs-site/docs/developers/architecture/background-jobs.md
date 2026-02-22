# Background Jobs: Announcements

## Auto-Archive Cron Job

The announcements feature includes a background job that automatically moves expired announcements from `published` status to `archived` status, helping keep the community feed relevant without requiring manual admin intervention.

### Implementation Details

- **Route:** `app/api/cron/archive-announcements/route.ts`
- **Method:** `GET`
- **Trigger:** Vercel Cron (configured in `vercel.json`)
- **Security:** Protected by the `CRON_SECRET` environment variable, which Vercel automatically injects into cron requests.

### Execution Flow

1. **Authentication:** The route verifies the `Authorization: Bearer <CRON_SECRET>` header. Returns `401 Unauthorized` if invalid.
2. **Query:** Uses the Supabase service role client to bypass RLS and query the `announcements` table for records where:
   - `status` is exactly `'published'`
   - `auto_archive_date` is not null
   - `auto_archive_date` is less than or equal to the current UTC time (`now()`).
3. **Execution:** 
   - If no records match, it logs and returns early to save resources.
   - If records match, it executes an `UPDATE` query changing the `status` to `'archived'`, setting `archived_at` to the current time, and updating `updated_at`.
4. **Logging & Response:** Logs the count and IDs of successfully archived announcements and returns a JSON summary.

### Application Impact

Once an announcement is archived by this job:
- It disappears from the primary "Official Communications" feed on the resident dashboard widget.
- It remains accessible through the "Archive" view (`app/t/[slug]/dashboard/official/page.tsx`).
- It no longer counts towards "Unread" notification badges, even for users who never saw it.
- Admins see its status updated to "Archived" in the management data table.
