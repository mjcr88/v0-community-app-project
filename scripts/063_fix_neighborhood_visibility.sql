-- Fix Neighborhood visibility RLS policy by using a SECURITY DEFINER function
-- This avoids potential recursion or complexity limits when policies reference users table repeatedly

-- 1. Create a secure function to check resident status
-- SECURITY DEFINER means this runs with the privileges of the creator (postgres/admin),
-- bypassing RLS checks on the users table for this specific query.
CREATE OR REPLACE FUNCTION public.is_resident_of_tenant(check_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  is_auth_resident BOOLEAN;
BEGIN
  -- Check if the current user is a resident of the specific tenant
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'resident'
    AND tenant_id = check_tenant_id
  ) INTO is_auth_resident;
  
  RETURN is_auth_resident;
END;
$$;

-- 2. Update the policy to use the secure function
-- NOTE: Using just 'neighborhoods' as some environments might be sensitive to schema prefix if search_path is weird,
-- but standard public.neighborhoods should work if the table exists.
DROP POLICY IF EXISTS "residents_view_neighborhoods_in_tenant" ON neighborhoods;

CREATE POLICY "residents_view_neighborhoods_in_tenant" ON neighborhoods
  FOR SELECT
  USING (
    public.is_resident_of_tenant(tenant_id)
  );

-- Notify
DO $$
BEGIN
  RAISE NOTICE 'Updated neighborhood RLS to use SECURITY DEFINER function';
END $$;
