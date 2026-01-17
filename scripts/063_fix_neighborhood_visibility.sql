-- Fix Neighborhood RLS policies by using a SECURITY DEFINER function
-- This avoids infinite recursion when residents query neighborhoods, which queries users, which queries lots, etc.

-- 1. Create a secure function to check tenant residency that doesn't trigger RLS loop
CREATE OR REPLACE FUNCTION public.is_resident_of_tenant(check_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth, pg_catalog
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

-- 2. Drop the problematic recursive policy
DROP POLICY IF EXISTS "residents_view_neighborhoods_in_tenant" ON public.neighborhoods;

-- 3. Create the new policy using the secure function
-- This policy allows residents to see all neighborhoods in their tenant
CREATE POLICY "residents_view_neighborhoods_in_tenant" ON public.neighborhoods
  FOR SELECT
  USING (
    public.is_resident_of_tenant(tenant_id)
  );

-- Notify
DO $$
BEGIN
  RAISE NOTICE 'Updated neighborhood RLS to use SECURITY DEFINER function';
END $$;
