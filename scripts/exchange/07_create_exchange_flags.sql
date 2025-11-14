-- Create exchange_flags table (resident flagging for moderation)
CREATE TABLE IF NOT EXISTS exchange_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES exchange_listings(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- One flag per user per listing
  UNIQUE(listing_id, flagged_by)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_flags_listing_id ON exchange_flags(listing_id);
CREATE INDEX IF NOT EXISTS idx_exchange_flags_flagged_by ON exchange_flags(flagged_by);
CREATE INDEX IF NOT EXISTS idx_exchange_flags_tenant_id ON exchange_flags(tenant_id);

-- Add comments for documentation
COMMENT ON TABLE exchange_flags IS 'Residents can flag exchange listings for admin review';

-- Create trigger to set is_flagged on first flag
CREATE OR REPLACE FUNCTION set_exchange_listing_flagged()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE exchange_listings 
  SET is_flagged = true, 
      flagged_at = now()
  WHERE id = NEW.listing_id 
    AND is_flagged = false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_exchange_listing_flagged ON exchange_flags;
CREATE TRIGGER trigger_set_exchange_listing_flagged
  AFTER INSERT ON exchange_flags
  FOR EACH ROW
  EXECUTE FUNCTION set_exchange_listing_flagged();

-- Create function to unflag listing when all flags are removed
CREATE OR REPLACE FUNCTION check_exchange_listing_unflagged()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there are any remaining flags for this listing
  IF NOT EXISTS (SELECT 1 FROM exchange_flags WHERE listing_id = OLD.listing_id) THEN
    UPDATE exchange_listings 
    SET is_flagged = false, 
        flagged_at = NULL
    WHERE id = OLD.listing_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_exchange_listing_unflagged ON exchange_flags;
CREATE TRIGGER trigger_check_exchange_listing_unflagged
  AFTER DELETE ON exchange_flags
  FOR EACH ROW
  EXECUTE FUNCTION check_exchange_listing_unflagged();
