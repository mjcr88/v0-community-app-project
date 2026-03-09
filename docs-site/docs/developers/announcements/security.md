# Announcements: Security & Privacy

Security for the Announcements feature is implemented using a combination of Supabase Row Level Security (RLS) for data integrity and Next.js Server Actions for operational authorization.

## Authorization Levels

Authorization is strictly enforced in the Server Actions layer to ensure only authorized users can perform administrative tasks.

| Role | Permissions | Enforcement Layer |
| :--- | :--- | :--- |
| **Super Admin** | Full access to all announcements in any tenant. | Server Actions (`userData.role === 'super_admin'`) |
| **Tenant Admin** | Create, Update, Publish, Archive, and Delete announcements in their tenant. | Server Actions (`userData.is_tenant_admin` or `userData.role === 'tenant_admin'`) |
| **Resident** | View published announcements. Mark as read. | Server Actions + RLS (`tenant_id` check) |

### Administrative Enforcement

Administrative actions (insert, update, delete) verify the user's role before interacting with the database:

```typescript
// Example from app/actions/announcements.ts
const isAdmin = userData?.is_tenant_admin || userData?.role === "tenant_admin" || userData?.role === "super_admin"

if (!isAdmin) {
  return { success: false, error: "Only tenant admins can create announcements" }
}
```

## Data Isolation (Multi-Tenancy)

Multi-tenancy is enforced at both the application and database levels:
- **Application Level**: Every Server Action requires a `tenant_id` and filters all queries by it.
- **Database Level (RLS)**: Policies on the `announcements` table ensure it is impossible for a user authenticated in Tenant A to read or modify data belonging to Tenant B.

## Resident Access & Targeting

Announcements can be community-wide or targeted to specific neighborhoods. Resident access is filtered dynamically based on their profile data.

### Neighborhood Targeting logic
Residents only see announcements where:
1. `announcement_neighborhoods` is empty (Community-wide).
2. The resident's `lot_id` corresponds to a `neighborhood_id` listed in `announcement_neighborhoods`.

This logic is executed in the `getAnnouncements` action to ensure residents only receive relevant content in their feed.

## Privacy & Read Receipts

To protect resident privacy while providing engagement insights:
- **Read Receipts**: The `announcement_reads` table tracks when a user has seen an announcement. This is used for unread counts but is not exposed in public views to other residents.
- **Creator Metadata**: Only basic profile information (name, profile picture) of the admin who created the announcement is shared with residents.
