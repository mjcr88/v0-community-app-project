-- Create exchange_listings table
CREATE TABLE IF NOT EXISTS exchange_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES exchange_categories(id) ON DELETE RESTRICT,
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'cancelled')),
  is_available BOOLEAN DEFAULT true,
  
  -- Pricing
  pricing_type TEXT NOT NULL DEFAULT 'free' CHECK (pricing_type IN ('free', 'fixed_price', 'pay_what_you_want')),
  price DECIMAL(10, 2), -- For fixed_price
  
  -- Condition (for Tools & Equipment)
  condition TEXT CHECK (condition IN ('new', 'slightly_used', 'used', 'slightly_damaged', 'maintenance')),
  
  -- Quantity (for Food & Produce, Services & Skills)
  available_quantity INTEGER DEFAULT 1,
  
  -- Location
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL, -- Community location
  custom_location_name TEXT,
  custom_location_lat DECIMAL(10, 8),
  custom_location_lng DECIMAL(11, 8),
  custom_location_address TEXT,
  
  -- Visibility
  visibility_scope TEXT NOT NULL DEFAULT 'community' CHECK (visibility_scope IN ('community', 'neighborhood')),
  
  -- Flagging
  is_flagged BOOLEAN DEFAULT false,
  flagged_at TIMESTAMPTZ,
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_listings_tenant_id ON exchange_listings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exchange_listings_created_by ON exchange_listings(created_by);
CREATE INDEX IF NOT EXISTS idx_exchange_listings_category_id ON exchange_listings(category_id);
CREATE INDEX IF NOT EXISTS idx_exchange_listings_location_id ON exchange_listings(location_id);
CREATE INDEX IF NOT EXISTS idx_exchange_listings_status ON exchange_listings(status);
CREATE INDEX IF NOT EXISTS idx_exchange_listings_is_flagged ON exchange_listings(is_flagged);

-- Add comments for documentation
COMMENT ON TABLE exchange_listings IS 'Main exchange listings table for community item/service sharing';
COMMENT ON COLUMN exchange_listings.status IS 'draft, published, paused, or cancelled';
COMMENT ON COLUMN exchange_listings.pricing_type IS 'free, fixed_price, or pay_what_you_want';
COMMENT ON COLUMN exchange_listings.condition IS 'Item condition for Tools & Equipment category';
COMMENT ON COLUMN exchange_listings.available_quantity IS 'Available quantity for Food & Produce and Services';
COMMENT ON COLUMN exchange_listings.visibility_scope IS 'community-wide or neighborhood-only';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_exchange_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exchange_listings_updated_at
  BEFORE UPDATE ON exchange_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_exchange_listings_updated_at();
