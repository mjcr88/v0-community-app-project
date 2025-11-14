-- Make description optional for exchange listings
-- This aligns the database schema with the UI where description is not required

ALTER TABLE exchange_listings 
ALTER COLUMN description DROP NOT NULL;

COMMENT ON COLUMN exchange_listings.description IS 'Optional detailed description of the listing';
