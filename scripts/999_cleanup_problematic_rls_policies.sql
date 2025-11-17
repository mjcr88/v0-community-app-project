-- ============================================================================
-- CLEANUP SCRIPT: Remove problematic RLS policies added by v0
-- ============================================================================
-- This script removes the policies that caused infinite recursion and other issues
-- Then verifies that the original policies are still in place
-- ============================================================================

-- ============================================================================
-- STEP 1: Remove problematic policies from users table
-- ============================================================================

-- Remove the infinite recursion policy
DROP POLICY IF EXISTS "users_can_view_admins_in_tenant" ON public.users;

-- ============================================================================
-- STEP 2: Verify original users table policies exist
-- ============================================================================

-- These should still exist (from scripts/003_fix_rls_policies.sql):
-- 1. super_admins_all_users
-- 2. tenant_admins_tenant_users  
-- 3. users_own_data

-- Query to check what policies exist on users table:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- ============================================================================
-- STEP 3: Remove any modified exchange_flags policies
-- ============================================================================

-- Remove any policy I might have added that allows residents to view all flags
DROP POLICY IF EXISTS "Residents can view all exchange flags in tenant" ON exchange_flags;
DROP POLICY IF EXISTS "residents_view_all_flags" ON exchange_flags;
DROP POLICY IF EXISTS "users_can_view_exchange_flags_in_tenant" ON exchange_flags;

-- ============================================================================
-- STEP 4: Verify original exchange_flags policies exist
-- ============================================================================

-- These should exist (from scripts/exchange/08_create_exchange_rls_policies.sql):
-- 1. Users can view exchange flags for their listings
-- 2. Tenant admins can view all exchange flags
-- 3. Residents can flag exchange listings
-- 4. Admins can remove exchange flags

-- Query to check what policies exist on exchange_flags table:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'exchange_flags'
ORDER BY policyname;

-- ============================================================================
-- STEP 5: Verification Summary
-- ============================================================================

-- Check if infinite recursion is fixed by querying users table
SELECT id, email, role, is_tenant_admin, tenant_id 
FROM public.users 
WHERE tenant_id = '0cfc777f-5798-470d-a2ad-c8573eceba7e'
LIMIT 5;

-- If the above query returns results without error, the infinite recursion is fixed!

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- After running this script:
-- 1. No more infinite recursion errors
-- 2. Users table should have 3 policies (super_admins, tenant_admins, users_own)
-- 3. Exchange_flags should have 4 policies (view own, admins view all, create, delete)
-- 4. The app should load normally again
-- ============================================================================
