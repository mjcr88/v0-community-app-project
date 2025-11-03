-- Fix infinite recursion in residents RLS policies
-- Root cause: Policies were querying residents table from within residents policies
-- Solution: Use simple policies that don't create circular dependencies

-- Drop all existing policies on residents
DROP POLICY IF EXISTS "tenant_admins_full_access" ON residents;
DROP POLICY IF EXISTS "residents_view_same_tenant" ON residents;
DROP POLICY IF EXISTS "residents_update_own" ON residents;
DROP POLICY IF EXISTS "service_role_full_access" ON residents;
DROP POLICY IF EXISTS "authenticated_view_tenant_residents" ON residents;
DROP POLICY IF EXISTS "admins_insert_residents" ON residents;
DROP POLICY IF EXISTS "admins_update_residents" ON residents;
DROP POLICY IF EXISTS "admins_delete_residents" ON residents;

-- Enable RLS
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service role has full access (for server-side admin operations)
-- This bypasses RLS entirely and is used by the admin interface
CREATE POLICY "service_role_full_access" ON residents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Authenticated users can view their own record only
-- No circular dependency - just checks auth_user_id
CREATE POLICY "users_view_own_record" ON residents
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Policy 3: Authenticated users can update their own record only
CREATE POLICY "users_update_own_record" ON residents
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Note: All admin operations (viewing all residents, creating, deleting) 
-- are done server-side using the service role key, which bypasses RLS.
-- This avoids the infinite recursion problem entirely.
