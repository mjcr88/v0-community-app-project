# Neighbor Directory: Security & Privacy

Security for the Resident Directory is enforced through a multi-layered approach involving database policies and server-side logic.

## Row Level Security (RLS)

The primary defense mechanism is Supabase RLS, which ensures that users can only access data belonging to their tenant and as permitted by their role.

### Key Policies
- **Tenant Isolation**: Every query includes a `tenant_id` check.
    - `CREATE POLICY "Users can see data in their tenant" ON "public"."users" FOR SELECT USING (tenant_id = auth.uid_tenant_id());`
- **Role-Based Access (RBAC)**:
    - **Admins** have elevated permissions to view all resident data (PII included) within their tenant for management purposes.
    - **Residents** have restricted view access, governed further by the privacy filtering layer.
- **Recursive Protection**: To prevent circular dependencies in policies (e.g., checking a user's role by querying the users table), the system uses optimized helper functions like `is_tenant_admin()`.

## Privacy Filtering Layer

While RLS handles *access*, the privacy layer handles *presentation*. This is critical for the social aspects of the Resident Directory.

### `applyPrivacyFilter` Logic
Located in `lib/privacy-utils.ts`, this utility is used in server components before sending data to the client.

| Scope | Visibility |
| :--- | :--- |
| **Self** | Sees all personal data and settings. |
| **Family Member** | Sees full profile of household members (bypasses privacy settings). |
| **Tenant Admin** | Sees full profile for management (bypasses privacy settings). |
| **Regular Resident** | Sees masked data based on target user's `user_privacy_settings`. |

### Masked Fields
The following fields are conditionally nulled out for regular residents:
- `email`
- `phone`
- `birthday`
- `birth_country` & `current_country`
- `journey_stage`
- `interests` & `skills` (if toggled off)

*Note: Resident Name and Lot Number are always visible to foster community connection.*

## Data Safety
- **Server Actions**: All mutations in `app/actions/` perform session validation and tenant-ownership checks before proceeding.
- **PII Protection**: Raw sensitive data is never serialized to the client without passing through the privacy utility or being restricted by RLS at the source.
