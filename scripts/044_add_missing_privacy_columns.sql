-- Add missing columns to user_privacy_settings table
ALTER TABLE user_privacy_settings
ADD COLUMN IF NOT EXISTS show_email boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_preferred_language boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_neighborhood boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_family boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_family_relationships boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_open_to_requests boolean DEFAULT true;

-- Add comment explaining the table
COMMENT ON TABLE user_privacy_settings IS 'Privacy settings for users to control what information is visible to other residents';
