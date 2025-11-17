-- Add archived fields to exchange_listings for Sprint 10: Listing & Transaction History
ALTER TABLE exchange_listings 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for performance on archived listings queries
CREATE INDEX IF NOT EXISTS idx_exchange_listings_archived 
ON exchange_listings(tenant_id, archived_at) 
WHERE archived_at IS NOT NULL;

-- Index for creator's archived listings
CREATE INDEX IF NOT EXISTS idx_exchange_listings_archived_creator 
ON exchange_listings(tenant_id, created_by, archived_at) 
WHERE archived_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN exchange_listings.archived_at IS 'Timestamp when listing was archived (manually or cancelled)';
COMMENT ON COLUMN exchange_listings.archived_by IS 'User who archived the listing';
