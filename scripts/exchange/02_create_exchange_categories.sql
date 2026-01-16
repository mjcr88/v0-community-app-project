-- Create exchange_categories table
CREATE TABLE IF NOT EXISTS exchange_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id, name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_categories_tenant_id ON exchange_categories(tenant_id);

-- Add comments for documentation
COMMENT ON TABLE exchange_categories IS 'Hard-coded categories for exchange listings';

-- Seed default categories (will be added per tenant when feature is enabled)
-- Categories: Tools & Equipment, Food & Produce, Household items, Services & Skills, Rides & Carpooling, House sitting & Rentals
