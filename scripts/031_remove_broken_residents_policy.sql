-- Remove the policy that causes infinite recursion
-- This policy was attempting to allow residents to view other residents
-- but it created infinite recursion by querying the users table within the policy

DROP POLICY IF EXISTS "Residents can view other residents in their tenant" ON public.users;

-- Note: The existing policies from script 001 already handle:
-- 1. Super admins can see all users (super_admins_select_all_users)
-- 2. Tenant admins can see users in their tenant (tenant_admins_select_tenant_users)  
-- 3. Users can see their own data (users_select_own)
--
-- For residents to see other residents in their lot/family, we'll handle this
-- at the application level by using service role queries or a different approach
-- that doesn't cause recursion.
