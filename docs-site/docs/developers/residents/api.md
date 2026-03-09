# Neighbor Directory: API Reference

Technical reference for the server-side logic driving the Resident Directory.

## Server Actions

### Profile Management (`app/actions/profile.ts`)
- `updateResidentProfile(data)`:
    - Validates session and tenant.
    - Updates `users` table.
    - Synchronizes `user_interests` and `user_skills` (upsert/delete pattern).
    - Logs activity for auditing.

### Directory Interactions (`app/actions/neighbor-lists.ts`)
- `getNeighborLists(tenantId)`: Fetches custom groupings created by the resident.
- `createNeighborList(name, memberIds)`: Creates a new private list for organizing neighbors.

### Request Management (`app/actions/resident-requests.ts`)
- `createResidentRequest(data)`:
    - Links request to a `tenant_id`.
    - Handles "Complaints" where specific residents or pets can be tagged.
    - Triggers notifications to community admins.

## Data Fetching Utilities (`lib/data/`)

### `residents.ts`
- `getResidents(tenantId, options)`:
    - Unified fetcher with modular enrichment (`enrichWithFamily`, `enrichWithLot`).
    - Handles search and role-based filtering.
    - Cached via React `cache` for optimization within server components.

### `families.ts`
- `getFamilies(tenantId, options)`:
    - Fetches household groupings.
    - Can optionally enrich with full member lists and pet data.

## Background Hooks (Admin)

### `hooks/admin/use-family-by-lot.ts`
- Real-time client-side hook used in Admin UI to resolve household context when selecting a physical lot.
- Handles loading states and error boundaries for community managers.
