-- Audit RLS Policies
-- Run this in Supabase SQL Editor

-- 1. List all RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    roles, 
    qual, 
    with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- 2. Check for tables with RLS disabled
SELECT 
    schemaname, 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- 3. Identify potentially insecure policies (permissive)
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND (qual LIKE '%true%' OR qual LIKE '%1=1%')
AND policyname NOT LIKE '%admin%';
