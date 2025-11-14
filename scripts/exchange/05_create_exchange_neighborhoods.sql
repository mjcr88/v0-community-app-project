-- Create exchange_neighborhoods junction table
CREATE TABLE IF NOT EXISTS exchange_neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES exchange_listings(id) ON DELETE CASCADE,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(listing_id, neighborhood_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_neighborhoods_listing_id ON exchange_neighborhoods(listing_id);
CREATE INDEX IF NOT EXISTS idx_exchange_neighborhoods_neighborhood_id ON exchange_neighborhoods(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_exchange_neighborhoods_tenant_id ON exchange_neighborhoods(tenant_id);

-- Add comments for documentation
COMMENT ON TABLE exchange_neighborhoods IS 'Junction table linking exchange listings to neighborhoods for neighborhood-only visibility';
