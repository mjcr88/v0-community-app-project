-- Migration: 20260212000003_fix_users_rls_recursion.sql
-- Description: Fixes infinite recursion in `users` RLS policies by replacing direct subqueries on `users` table
-- with the `is_tenant_admin_of_tenant` SECURITY DEFINER function.

BEGIN;

-- Drop existing problematic policies that cause recursion
DROP POLICY IF EXISTS "tenant_admins_insert_users" ON "public"."users";
DROP POLICY IF EXISTS "tenant_admins_update_users" ON "public"."users";
DROP POLICY IF EXISTS "tenant_admins_delete_users" ON "public"."users";

-- Recreate policies using the SECURITY DEFINER function to avoid recursion loop
-- The function `is_tenant_admin_of_tenant(uuid)` validates if the executing user (auth.uid())
-- is a tenant_admin of the passed tenant_id, effectively hiding the `users` lookup from RLS.

CREATE POLICY "tenant_admins_insert_users" ON "public"."users" 
FOR INSERT TO "authenticated" 
WITH CHECK (
  public.is_tenant_admin_of_tenant(tenant_id)
);

CREATE POLICY "tenant_admins_update_users" ON "public"."users" 
FOR UPDATE TO "authenticated" 
USING (
  public.is_tenant_admin_of_tenant(tenant_id)
);

CREATE POLICY "tenant_admins_delete_users" ON "public"."users" 
FOR DELETE TO "authenticated" 
USING (
  public.is_tenant_admin_of_tenant(tenant_id)
);

COMMIT;
