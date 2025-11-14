-- Create exchange_images table
CREATE TABLE IF NOT EXISTS exchange_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES exchange_listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_hero BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_images_listing_id ON exchange_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_exchange_images_tenant_id ON exchange_images(tenant_id);

-- Add comments for documentation
COMMENT ON TABLE exchange_images IS 'Images for exchange listings (up to 5 per listing)';
COMMENT ON COLUMN exchange_images.is_hero IS 'First image is hero by default, can be changed by creator';
COMMENT ON COLUMN exchange_images.display_order IS 'Order of images in gallery';

-- Ensure only one hero image per listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_images_one_hero_per_listing
  ON exchange_images(listing_id)
  WHERE is_hero = true;
