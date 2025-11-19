-- Export all RLS policies from the database
-- This script retrieves all Row Level Security policies with their definitions
-- Run this in the Supabase SQL Editor to see all your RLS policies

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- For a more detailed view with formatted output:
SELECT 
    format(
        E'-- Table: %s.%s\n-- Policy: %s\nCREATE POLICY "%s"\n  ON %s.%s\n  AS %s\n  FOR %s\n  TO %s\n  USING (%s)%s;\n',
        schemaname,
        tablename,
        policyname,
        policyname,
        schemaname,
        tablename,
        CASE WHEN permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
        cmd,
        array_to_string(roles, ', '),
        COALESCE(qual, 'true'),
        CASE 
            WHEN with_check IS NOT NULL THEN format(E'\n  WITH CHECK (%s)', with_check)
            ELSE ''
        END
    ) as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- To see which tables have RLS enabled:
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- Complete export with table info and policies:
SELECT 
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count,
    array_agg(p.policyname ORDER BY p.policyname) as policies
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename 
    AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
