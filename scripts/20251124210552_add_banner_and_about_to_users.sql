-- Add banner_image_url and about fields to users table
-- Run this migration manually in your Supabase dashboard or via CLI

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS about TEXT CHECK (char_length(about) <= 1000);

-- Add comments for documentation
COMMENT ON COLUMN users.banner_image_url IS 'URL to user uploaded banner image (max 5MB, stored in Vercel Blob)';
COMMENT ON COLUMN users.about IS 'Rich text about section (max 1000 characters, supports line breaks and URLs)';
