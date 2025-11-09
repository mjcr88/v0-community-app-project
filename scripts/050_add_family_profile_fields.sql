-- Add profile fields to family_units table
ALTER TABLE family_units
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment to document the new columns
COMMENT ON COLUMN family_units.profile_picture_url IS 'URL to the family profile picture stored in Blob storage';
COMMENT ON COLUMN family_units.description IS 'Family description or bio written by the primary contact';
