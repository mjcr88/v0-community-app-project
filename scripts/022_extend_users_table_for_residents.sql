-- Phase 1: Extend users table to support residents
-- This is a NON-BREAKING change that adds resident-specific fields to the users table

-- Add role enum type
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_admin', 'resident');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add resident-specific columns to users table
ALTER TABLE users
  -- Role management
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'resident',
  
  -- Personal information (some may already exist)
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
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  
  -- Invite tracking (may already exist)
  ADD COLUMN IF NOT EXISTS invite_token UUID,
  ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ;

-- Update existing super admins to have the correct role
UPDATE users 
SET role = 'super_admin' 
WHERE is_super_admin = true;

-- Update existing tenant admins to have the correct role
UPDATE users 
SET role = 'tenant_admin' 
WHERE is_super_admin = false AND tenant_id IS NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_users_lot_id ON users(lot_id);
CREATE INDEX IF NOT EXISTS idx_users_family_unit_id ON users(family_unit_id);
CREATE INDEX IF NOT EXISTS idx_users_invite_token ON users(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed) WHERE role = 'resident';

-- Add computed column for full name (for backwards compatibility)
-- This will be used in queries that expect a 'name' field
CREATE OR REPLACE FUNCTION get_user_full_name(users) RETURNS TEXT AS $$
  SELECT CASE 
    WHEN $1.first_name IS NOT NULL AND $1.last_name IS NOT NULL 
    THEN $1.first_name || ' ' || $1.last_name
    WHEN $1.name IS NOT NULL 
    THEN $1.name
    ELSE $1.email
  END;
$$ LANGUAGE SQL STABLE;

-- Add comment explaining the migration
COMMENT ON TABLE users IS 'Unified user table containing super_admins, tenant_admins, and residents. Role field determines user type.';
COMMENT ON COLUMN users.role IS 'User role: super_admin (platform admin), tenant_admin (community admin), or resident (community member)';
COMMENT ON COLUMN users.is_tenant_admin IS 'Flag for residents who also have admin privileges in their tenant';
