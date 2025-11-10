-- Add hero_photo column to tables that support photo galleries
-- This stores the URL of the designated hero/featured photo

-- Locations already has photos array, add hero_photo
ALTER TABLE locations ADD COLUMN IF NOT EXISTS hero_photo text;
COMMENT ON COLUMN locations.hero_photo IS 'URL of the hero/featured photo for this location';

-- Family units: add photos array and hero_photo
ALTER TABLE family_units ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
ALTER TABLE family_units ADD COLUMN IF NOT EXISTS hero_photo text;
COMMENT ON COLUMN family_units.photos IS 'Array of photo URLs for family gallery';
COMMENT ON COLUMN family_units.hero_photo IS 'URL of the hero/featured photo for this family';

-- Users: add photos array and hero_photo (profile_picture_url becomes hero_photo reference)
ALTER TABLE users ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS hero_photo text;
COMMENT ON COLUMN users.photos IS 'Array of photo URLs for user gallery';
COMMENT ON COLUMN users.hero_photo IS 'URL of the hero/featured photo for this user';

-- Pets: add photos array and hero_photo (profile_picture_url becomes hero_photo reference)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS hero_photo text;
COMMENT ON COLUMN pets.photos IS 'Array of photo URLs for pet gallery';
COMMENT ON COLUMN pets.hero_photo IS 'URL of the hero/featured photo for this pet';

-- Neighborhoods: add photos array and hero_photo
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS hero_photo text;
COMMENT ON COLUMN neighborhoods.photos IS 'Array of photo URLs for neighborhood gallery';
COMMENT ON COLUMN neighborhoods.hero_photo IS 'URL of the hero/featured photo for this neighborhood';
