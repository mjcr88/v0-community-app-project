-- Migration: 20260212000002_add_is_tenant_admin_func.sql
-- Description: Adds the `is_tenant_admin_of_tenant` function which is required by RLS policies in 20260212000003.

BEGIN;

CREATE OR REPLACE FUNCTION "public"."is_tenant_admin_of_tenant"("check_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_catalog'
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

ALTER FUNCTION "public"."is_tenant_admin_of_tenant"("check_tenant_id" "uuid") OWNER TO "postgres";

COMMIT;
