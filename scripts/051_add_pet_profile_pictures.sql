-- Add profile_picture_url column to pets table
ALTER TABLE pets
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comment
COMMENT ON COLUMN pets.profile_picture_url IS 'URL to the pet profile picture stored in Blob storage';
