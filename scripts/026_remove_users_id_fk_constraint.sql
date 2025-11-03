-- Remove the foreign key constraint on users.id
-- This allows us to create user records without requiring an auth.users record first
-- Residents can be created by admins and later link to auth users when they accept invites

ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Make id column generate UUIDs by default if not provided
ALTER TABLE public.users 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add a comment explaining the design
COMMENT ON COLUMN public.users.id IS 'Primary key. Can be set to auth.users.id for authenticated users, or auto-generated for users created before authentication (e.g., invited residents).';

-- Verification
SELECT 
  'users.id constraint removed' as status,
  COUNT(*) as total_users
FROM public.users;
