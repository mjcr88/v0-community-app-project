-- WP1: Privacy Scope Testing
-- Purpose: Test that privacy settings properly filter user visibility
-- Run these tests AFTER RLS audit to verify privacy implementation

-- NOTE: This script removed privacy-specific queries since user_privacy_settings
-- uses show_* boolean columns rather than visibility scope enums.
-- Manual testing is required for privacy features.

-- ============================================================================
-- VERIFICATION QUERY 1: Check Current Privacy Policy
-- ============================================================================

-- Get the definition of the critical privacy policy
SELECT 
  schemaname,
  tablename,
  policyname,
  qual as policy_condition
FROM pg_policies
WHERE policyname = 'residents_view_based_on_scope';

-- Expected: Should include logic for:
-- 1. Users can see their own data (auth.uid() = id)
-- 2. Super admins see all
-- 3. Tenant admins see all in their tenant
-- 4. Residents see based on privacy settings

-- ============================================================================
-- VERIFICATION QUERY 2: Test Privacy Settings Table Exists
-- ============================================================================

-- First, check if user_privacy_settings table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_privacy_settings'
) as privacy_table_exists;

-- Check what columns exist in the table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_privacy_settings'
ORDER BY ordinal_position;

-- Count users with privacy settings
SELECT COUNT(*) as users_with_settings
FROM user_privacy_settings;

-- ============================================================================
-- VERIFICATION QUERY 3: Test Basic Visibility
-- ============================================================================

-- Basic query to see user data visible to current user
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  l.lot_number,
  n.name as neighborhood
FROM users u
LEFT JOIN lots l ON u.lot_id = l.id
LEFT JOIN neighborhoods n ON l.neighborhood_id = n.id
WHERE u.tenant_id = get_user_tenant_id()
  AND u.role = 'resident'
ORDER BY n.name, l.lot_number
LIMIT 20;

-- ============================================================================
-- VERIFICATION QUERY 4: Test Admin Override
-- ============================================================================

-- Verify tenant admins can see all users
-- This query should work when run as tenant_admin
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.role
FROM users u
WHERE u.tenant_id = get_user_tenant_id()
ORDER BY u.role, u.first_name
LIMIT 20;

-- Expected: Tenant admin should see ALL users with ALL fields

-- ============================================================================
-- VERIFICATION QUERY 5: Test User Privacy Settings
-- ============================================================================

-- Check privacy settings for users
SELECT 
  u.first_name,
  u.last_name,
  ups.show_phone,
  ups.show_email,
  ups.show_birthday,
  ups.show_interests,
  ups.show_skills
FROM users u
LEFT JOIN user_privacy_settings ups ON u.id = ups.user_id
WHERE u.tenant_id = get_user_tenant_id()
  AND u.role = 'resident'
LIMIT 20;

-- ============================================================================
-- MANUAL TESTING REQUIRED
-- ============================================================================

/*
The user_privacy_settings table uses boolean show_* columns rather than
visibility scope enums. Testing requires manual verification:

Scenario 1: Hidden Phone Number
1. Create test user with show_phone = false
2. Login as different resident
3. Verify phone number not visible in profile

Scenario 2: Hidden Interests
1. Create user with show_interests = false
2. Login as different resident  
3. Verify interests not visible

Scenario 3: Hidden Skills
1. Create user with show_skills = false
2. Login as different resident
3. Verify skills not visible

Scenario 4: Admin Override
1. Login as tenant_admin
2. Verify CAN see all fields regardless of privacy settings

Scenario 5: Own Profile
1. Login as any user
2. Verify user CAN see their own hidden fields
*/

-- ============================================================================
-- RLS POLICY FIX (if needed)
-- ============================================================================

/*
If privacy tests fail and you need to update the RLS policy,
create a new script: scripts/WP1/052_fix_privacy_scope_policies.sql

Example policy that respects show_* privacy settings:

DROP POLICY IF EXISTS "residents_view_based_on_scope" ON users;

CREATE POLICY "residents_view_based_on_scope" ON users
FOR SELECT
USING (
  -- User viewing their own data
  auth.uid() = id
  OR
  -- Super admin sees all
  get_user_role() = 'super_admin'
  OR
  -- Tenant admin sees all in their tenant
  (get_user_role() = 'tenant_admin' AND tenant_id = get_user_tenant_id())
  OR
  -- Residents see others in same tenant
  (role = 'resident' AND tenant_id = get_user_tenant_id())
);

-- Note: Privacy filtering must be handled in application layer
-- since each field has its own show_* boolean
*/
