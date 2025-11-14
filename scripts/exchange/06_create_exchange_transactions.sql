-- Create exchange_transactions table for borrowing/lending tracking
CREATE TABLE IF NOT EXISTS exchange_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES exchange_listings(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction details
  quantity INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'rejected', 'confirmed', 'picked_up', 'returned', 'completed')),
  
  -- Dates
  proposed_pickup_date TIMESTAMPTZ,
  proposed_return_date TIMESTAMPTZ,
  confirmed_pickup_date TIMESTAMPTZ,
  expected_return_date TIMESTAMPTZ,
  actual_pickup_date TIMESTAMPTZ,
  actual_return_date TIMESTAMPTZ,
  
  -- Messages
  borrower_message TEXT,
  lender_message TEXT,
  rejection_reason TEXT,
  
  -- Extension requests
  extension_requested BOOLEAN DEFAULT false,
  extension_new_date TIMESTAMPTZ,
  extension_message TEXT,
  
  -- Return condition
  return_condition TEXT CHECK (return_condition IN ('good', 'minor_wear', 'damaged', 'broken')),
  return_notes TEXT,
  return_damage_photo_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_tenant_id ON exchange_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_listing_id ON exchange_transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_borrower_id ON exchange_transactions(borrower_id);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_lender_id ON exchange_transactions(lender_id);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_status ON exchange_transactions(status);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_expected_return_date ON exchange_transactions(expected_return_date);

-- Add comments for documentation
COMMENT ON TABLE exchange_transactions IS 'Tracks borrowing/lending transactions from request to completion';
COMMENT ON COLUMN exchange_transactions.status IS 'requested → rejected/confirmed → picked_up → returned → completed';
COMMENT ON COLUMN exchange_transactions.lender_id IS 'The listing creator (person lending/offering)';
COMMENT ON COLUMN exchange_transactions.borrower_id IS 'The person requesting/borrowing';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_exchange_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exchange_transactions_updated_at
  BEFORE UPDATE ON exchange_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_exchange_transactions_updated_at();
