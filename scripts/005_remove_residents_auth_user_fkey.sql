-- Remove the foreign key constraint that incorrectly links residents.auth_user_id to users.id
-- Residents authenticate through Supabase Auth (auth.users), not the custom users table
-- The users table is only for super admins and tenant admins

ALTER TABLE residents 
DROP CONSTRAINT IF EXISTS residents_auth_user_id_fkey;

-- Add a comment to document that auth_user_id references auth.users (Supabase Auth)
COMMENT ON COLUMN residents.auth_user_id IS 'References auth.users.id (Supabase Auth), not the custom users table';
