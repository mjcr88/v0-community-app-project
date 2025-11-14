-- Add photos and hero_photo columns to exchange_listings
ALTER TABLE exchange_listings 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hero_photo TEXT;

-- Add index for photo queries
CREATE INDEX IF NOT EXISTS idx_exchange_listings_hero_photo ON exchange_listings(hero_photo) WHERE hero_photo IS NOT NULL;

-- Add comment
COMMENT ON COLUMN exchange_listings.photos IS 'Array of photo URLs uploaded to Vercel Blob';
COMMENT ON COLUMN exchange_listings.hero_photo IS 'Primary photo URL to display in listings';
