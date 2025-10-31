-- Phase 1: Extend users table to support residents
-- SIMPLIFIED APPROACH: Keep role as TEXT, just add new columns

-- Add a CHECK constraint to enforce valid role values
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('super_admin', 'tenant_admin', 'resident'));

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_users_lot_id ON users(lot_id);
CREATE INDEX IF NOT EXISTS idx_users_family_unit_id ON users(family_unit_id);
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed) WHERE role = 'resident';

-- Add computed column function for full name (for backwards compatibility)
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
