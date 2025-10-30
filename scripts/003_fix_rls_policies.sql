-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "super_admins_select_all_users" ON public.users;
DROP POLICY IF EXISTS "tenant_admins_select_tenant_users" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "super_admins_insert_users" ON public.users;
DROP POLICY IF EXISTS "super_admins_update_users" ON public.users;
DROP POLICY IF EXISTS "super_admins_select_tenants" ON public.tenants;
DROP POLICY IF EXISTS "super_admins_insert_tenants" ON public.tenants;
DROP POLICY IF EXISTS "super_admins_update_tenants" ON public.tenants;
DROP POLICY IF EXISTS "super_admins_delete_tenants" ON public.tenants;
DROP POLICY IF EXISTS "tenant_admins_select_own_tenant" ON public.tenants;

-- Create a function to get current user's role (avoids recursion)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Create a function to get current user's tenant_id (avoids recursion)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- RLS Policies for users table (using functions to avoid recursion)
-- Super admins can see all users
CREATE POLICY "super_admins_all_users" ON public.users
  FOR ALL
  USING (public.get_user_role() = 'super_admin')
  WITH CHECK (public.get_user_role() = 'super_admin');

-- Tenant admins can see users in their tenant
CREATE POLICY "tenant_admins_tenant_users" ON public.users
  FOR SELECT
  USING (
    public.get_user_role() = 'tenant_admin' 
    AND tenant_id = public.get_user_tenant_id()
  );

-- Users can see and update their own data
CREATE POLICY "users_own_data" ON public.users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for tenants table
-- Super admins can do everything with tenants
CREATE POLICY "super_admins_all_tenants" ON public.tenants
  FOR ALL
  USING (public.get_user_role() = 'super_admin')
  WITH CHECK (public.get_user_role() = 'super_admin');

-- Tenant admins can view their own tenant
CREATE POLICY "tenant_admins_own_tenant" ON public.tenants
  FOR SELECT
  USING (
    public.get_user_role() = 'tenant_admin' 
    AND id = public.get_user_tenant_id()
  );
