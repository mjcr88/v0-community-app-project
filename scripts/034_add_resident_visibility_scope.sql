-- Add resident visibility scope to tenants table
-- This controls whether residents can see all residents in the tenant or only in their neighborhood

-- Create ENUM type for visibility scope
DO $$ BEGIN
  CREATE TYPE resident_visibility_scope AS ENUM ('neighborhood', 'tenant');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add column to tenants table
ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS resident_visibility_scope resident_visibility_scope DEFAULT 'tenant';

-- Set default for existing tenants
UPDATE public.tenants 
SET resident_visibility_scope = 'tenant' 
WHERE resident_visibility_scope IS NULL;

-- Add comment
COMMENT ON COLUMN public.tenants.resident_visibility_scope IS 'Controls whether residents can view all residents in tenant or only in their neighborhood';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Added resident_visibility_scope to tenants table';
END $$;
