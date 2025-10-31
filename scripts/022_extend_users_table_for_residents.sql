-- Phase 1: Extend users table to support residents
-- This is a NON-BREAKING change that adds resident-specific fields to the users table

-- Drop policies and functions that reference the role column before altering it
DROP POLICY IF EXISTS "super_admins_all_users" ON public.users;
DROP POLICY IF EXISTS "tenant_admins_tenant_users" ON public.users;
DROP POLICY IF EXISTS "users_own_data" ON public.users;
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.get_user_tenant_id();

-- Create the enum type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_admin', 'resident');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update role column to use enum type instead of TEXT
ALTER TABLE users 
  ALTER COLUMN role TYPE user_role USING role::user_role;

-- Add resident-specific columns to users table
ALTER TABLE users
  -- Personal information
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
  
  -- Location information
  ADD COLUMN IF NOT EXISTS birth_country TEXT,
  ADD COLUMN IF NOT EXISTS current_country TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT[],
  ADD COLUMN IF NOT EXISTS preferred_language TEXT,
  
  -- Community relationships
  ADD COLUMN IF NOT EXISTS lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS family_unit_id UUID REFERENCES family_units(id) ON DELETE SET NULL,
  
  -- Journey information
  ADD COLUMN IF NOT EXISTS journey_stage TEXT CHECK (journey_stage IN ('planning', 'building', 'arriving', 'integrating')),
  ADD COLUMN IF NOT EXISTS estimated_move_in_date DATE,
  
  -- Admin flag for tenant admins who are also residents
  ADD COLUMN IF NOT EXISTS is_tenant_admin BOOLEAN DEFAULT false,
  
  -- Onboarding tracking
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Update existing users to ensure they have correct roles
-- Users with role 'super_admin' stay as super_admin
-- Users with role 'tenant_admin' stay as tenant_admin
UPDATE users 
SET role = 'resident'::user_role
WHERE role::text NOT IN ('super_admin', 'tenant_admin');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_users_lot_id ON users(lot_id);
CREATE INDEX IF NOT EXISTS idx_users_family_unit_id ON users(family_unit_id);
CREATE INDEX IF NOT EXISTS idx_users_invite_token ON users(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed) WHERE role = 'resident';

-- Recreate the helper functions with the new enum type
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Recreate RLS policies
CREATE POLICY "super_admins_all_users" ON public.users
  FOR ALL
  USING (public.get_user_role() = 'super_admin')
  WITH CHECK (public.get_user_role() = 'super_admin');

CREATE POLICY "tenant_admins_tenant_users" ON public.users
  FOR SELECT
  USING (
    public.get_user_role() = 'tenant_admin' 
    AND tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "users_own_data" ON public.users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add computed column for full name (for backwards compatibility)
CREATE OR REPLACE FUNCTION get_user_full_name(users) RETURNS TEXT AS $$
  SELECT CASE 
    WHEN $1.first_name IS NOT NULL AND $1.last_name IS NOT NULL 
    THEN $1.first_name || ' ' || $1.last_name
    WHEN $1.name IS NOT NULL 
    THEN $1.name
    ELSE $1.email
  END;
$$ LANGUAGE SQL STABLE;

-- Add comments explaining the migration
COMMENT ON TABLE users IS 'Unified user table containing super_admins, tenant_admins, and residents. Role field determines user type.';
COMMENT ON COLUMN users.role IS 'User role: super_admin (platform admin), tenant_admin (community admin), or resident (community member)';
COMMENT ON COLUMN users.is_tenant_admin IS 'Flag for residents who also have admin privileges in their tenant';

-- Log completion
DO $$
DECLARE
  total_users INTEGER;
  super_admin_count INTEGER;
  tenant_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM users;
  SELECT COUNT(*) INTO super_admin_count FROM users WHERE role = 'super_admin';
  SELECT COUNT(*) INTO tenant_admin_count FROM users WHERE role = 'tenant_admin';
  
  RAISE NOTICE 'Phase 1 complete: Users table extended with resident fields';
  RAISE NOTICE 'Existing users: %', total_users;
  RAISE NOTICE 'Super admins: %', super_admin_count;
  RAISE NOTICE 'Tenant admins: %', tenant_admin_count;
END $$;
