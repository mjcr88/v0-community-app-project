-- WP1: RLS Audit Report
-- Purpose: Automated audit queries to validate RLS policy coverage and identify issues
-- Run these queries in Supabase SQL Editor and review the results

-- ============================================================================
-- SECTION 1: COVERAGE CHECKS
-- ============================================================================

-- 1. Find all tables without RLS enabled
-- Expected: 0 rows (all tables have RLS)
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = pg_tables.tablename
);

-- 2. Count total tables and policies
-- Expected: 42 tables, 114 policies
SELECT 
  COUNT(DISTINCT tablename) as total_tables,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';

-- 3. Tables with policy counts
-- Review: Verify expected policy counts match validation document
SELECT 
  pol.tablename,
  COUNT(*) as policy_count,
  array_agg(pol.policyname ORDER BY pol.policyname) as policies
FROM pg_policies pol
WHERE pol.schemaname = 'public'
GROUP BY pol.tablename
ORDER BY pol.tablename;

-- ============================================================================
-- SECTION 2: CRITICAL POLICY REVIEWS
-- ============================================================================

-- 4. Get definitions for the 4 critical policies requiring review
-- CRITICAL: Review these for potential recursion
SELECT 
  schemaname,
  tablename,
  policyname,
  qual as policy_condition
FROM pg_policies
WHERE policyname IN (
  'residents_view_based_on_scope',
  'residents_can_view_privacy_settings_in_scope'
);

-- 5. Find policies with potential recursive patterns
-- Review each result for recursion risk
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%FROM users%' THEN 'References users table'
    WHEN qual LIKE '%FROM residents%' THEN 'References residents table'
    ELSE 'Other pattern'
  END as recursion_risk
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'residents')
AND (qual LIKE '%FROM users%' OR qual LIKE '%FROM residents%');

-- ============================================================================
-- SECTION 3: TENANT ISOLATION CHECKS
-- ============================================================================

-- 6. Find policies missing tenant_id filter on tenant-scoped tables
-- Review each - might be intentional (super_admin policies)
SELECT 
  schemaname,
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  SELECT tablename FROM information_schema.columns
  WHERE table_schema = 'public'
  AND column_name = 'tenant_id'
)
AND (qual NOT LIKE '%tenant_id%' AND qual NOT LIKE '%get_user_tenant_id%')
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 4: DUPLICATE POLICY CHECKS
-- ============================================================================

-- 7. Identify potential duplicate policies
-- Expected: event_rsvps, saved_events, pets
SELECT 
  tablename,
  array_agg(policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('event_rsvps', 'saved_events', 'pets')
GROUP BY tablename;

-- ============================================================================
-- SECTION 5: HELPER FUNCTION VERIFICATION
-- ============================================================================

-- 8. Verify helper functions exist
-- Expected: Policies should use get_user_role and get_user_tenant_id
SELECT DISTINCT
  CASE 
    WHEN qual LIKE '%get_user_role%' THEN 'get_user_role() is used'
    WHEN qual LIKE '%get_user_tenant_id%' THEN 'get_user_tenant_id() is used'
  END as helper_function
FROM pg_policies
WHERE qual LIKE '%get_user_role%' 
   OR qual LIKE '%get_user_tenant_id%';

-- 9. Find all policies using helper functions
-- Review: Should see many policies using these
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%get_user_role%' AND qual LIKE '%get_user_tenant_id%' THEN 'Uses both helpers'
    WHEN qual LIKE '%get_user_role%' THEN 'Uses get_user_role()'
    WHEN qual LIKE '%get_user_tenant_id%' THEN 'Uses get_user_tenant_id()'
  END as helper_usage
FROM pg_policies
WHERE schemaname = 'public'
AND (qual LIKE '%get_user_role%' OR qual LIKE '%get_user_tenant_id%')
ORDER BY helper_usage, tablename;

-- ============================================================================
-- SECTION 6: HIGH-PRIORITY TABLE REVIEWS
-- ============================================================================

-- 10. Events policies (5 policies expected)
SELECT 
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY policyname;

-- 11. Check-ins policies (9 policies - most granular)
SELECT 
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename = 'check_ins'
ORDER BY policyname;

-- 12. Exchange listings (8 policies - highly granular)
SELECT 
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename = 'exchange_listings'
ORDER BY policyname;

-- 13. Users policies (7 policies - CRITICAL)
SELECT 
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 14. Notifications policies (3 policies - polymorphic)
SELECT 
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- ============================================================================
-- SECTION 7: PRIVACY SCOPE CHECKS
-- ============================================================================

-- 15. Find all privacy-related policies
SELECT 
  tablename,
  policyname,
  qual as policy_condition
FROM pg_policies 
WHERE policyname LIKE '%scope%'
  OR policyname LIKE '%privacy%'
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 8: DEPRECATED TABLE CHECKS
-- ============================================================================

-- 16. Check for deprecated table policies (to cleanup after migration)
SELECT 
  tablename,
  policyname
FROM pg_policies 
WHERE tablename IN ('residents', 'resident_interests', 'resident_skills')
ORDER BY tablename, policyname;

-- 17. Verify these deprecated tables are empty
SELECT 
  'residents' as table_name,
  COUNT(*) as row_count
FROM residents
UNION ALL
SELECT 
  'resident_interests',
  COUNT(*)
FROM resident_interests
UNION ALL
SELECT 
  'resident_skills',
  COUNT(*)
FROM resident_skills;

-- ============================================================================
-- AUDIT COMPLETE
-- ============================================================================
-- Review all results above and document any issues found
-- Expected findings should match the RLS validation document:
--   - 42 tables with RLS enabled
--   - 114 total policies  
--   - 4 critical policies need manual review
--   - 3 deprecated tables to cleanup
-- ============================================================================
