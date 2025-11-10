-- Create event_categories table (tenant-specific)
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- lucide icon name
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_category_per_tenant UNIQUE(tenant_id, name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_categories_tenant_id ON event_categories(tenant_id);

-- Add comments for documentation
COMMENT ON TABLE event_categories IS 'Event categories configurable per tenant';
COMMENT ON COLUMN event_categories.icon IS 'Lucide icon name for category display';
