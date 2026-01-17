-- Fix Neighborhood Admin RLS policies by using a SECURITY DEFINER function
-- This avoids infinite recursion when admin policies query the users table

-- 1. Create a secure function to check tenant admin status
CREATE OR REPLACE FUNCTION public.is_tenant_admin_of_tenant(check_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if the current user is a tenant_admin of the specific tenant
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'tenant_admin'
    AND tenant_id = check_tenant_id
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

-- 2. Drop existing Admin policies that might cause recursion
DROP POLICY IF EXISTS "tenant_admins_select_neighborhoods" ON public.neighborhoods;
DROP POLICY IF EXISTS "tenant_admins_insert_neighborhoods" ON public.neighborhoods;
DROP POLICY IF EXISTS "tenant_admins_update_neighborhoods" ON public.neighborhoods;
DROP POLICY IF EXISTS "tenant_admins_delete_neighborhoods" ON public.neighborhoods;

-- 3. Re-create policies using the secure function

CREATE POLICY "tenant_admins_select_neighborhoods" ON public.neighborhoods
  FOR SELECT
  USING (
    public.is_tenant_admin_of_tenant(tenant_id)
  );

CREATE POLICY "tenant_admins_insert_neighborhoods" ON public.neighborhoods
  FOR INSERT
  WITH CHECK (
    public.is_tenant_admin_of_tenant(tenant_id)
  );

CREATE POLICY "tenant_admins_update_neighborhoods" ON public.neighborhoods
  FOR UPDATE
  USING (
    public.is_tenant_admin_of_tenant(tenant_id)
  );

CREATE POLICY "tenant_admins_delete_neighborhoods" ON public.neighborhoods
  FOR DELETE
  USING (
    public.is_tenant_admin_of_tenant(tenant_id)
  );

-- Notify
DO $$
BEGIN
  RAISE NOTICE 'Updated neighborhood Admin RLS to use SECURITY DEFINER function';
END $$;
