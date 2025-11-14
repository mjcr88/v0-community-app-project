-- Enable Row Level Security on all exchange tables
ALTER TABLE exchange_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_flags ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- EXCHANGE CATEGORIES POLICIES
-- ==============================================

-- Residents can view categories in their tenant
CREATE POLICY "Residents can view tenant exchange categories"
  ON exchange_categories
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Tenant admins can manage categories
CREATE POLICY "Tenant admins can manage exchange categories"
  ON exchange_categories
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'tenant_admin'
    )
  );

-- ==============================================
-- EXCHANGE LISTINGS POLICIES
-- ==============================================

-- Residents can view published listings in their tenant
CREATE POLICY "Residents can view published exchange listings"
  ON exchange_listings
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND status = 'published'
    AND cancelled_at IS NULL
  );

-- Creators can view their own listings (including drafts)
CREATE POLICY "Creators can view their own exchange listings"
  ON exchange_listings
  FOR SELECT
  USING (created_by = auth.uid());

-- Verified residents can create listings
CREATE POLICY "Verified residents can create exchange listings"
  ON exchange_listings
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM residents 
      WHERE auth_user_id = auth.uid() 
      AND onboarding_completed = true
    )
  );

-- Creators can update their own listings
CREATE POLICY "Creators can update their own exchange listings"
  ON exchange_listings
  FOR UPDATE
  USING (created_by = auth.uid());

-- Creators can delete their own listings
CREATE POLICY "Creators can delete their own exchange listings"
  ON exchange_listings
  FOR DELETE
  USING (created_by = auth.uid());

-- Tenant admins can view all listings
CREATE POLICY "Tenant admins can view all exchange listings"
  ON exchange_listings
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'tenant_admin'
    )
  );

-- Tenant admins can update listings (for cancellation)
CREATE POLICY "Tenant admins can update exchange listings"
  ON exchange_listings
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'tenant_admin'
    )
  );

-- ==============================================
-- EXCHANGE IMAGES POLICIES
-- ==============================================

-- Users can view images for listings they can see
CREATE POLICY "Users can view exchange images"
  ON exchange_images
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Creators can manage their listing images
CREATE POLICY "Creators can manage exchange images"
  ON exchange_images
  FOR ALL
  USING (
    listing_id IN (
      SELECT id FROM exchange_listings WHERE created_by = auth.uid()
    )
  );

-- ==============================================
-- EXCHANGE NEIGHBORHOODS POLICIES
-- ==============================================

-- Anyone in tenant can view neighborhood links
CREATE POLICY "Users can view exchange neighborhoods"
  ON exchange_neighborhoods
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Creators can manage their listing neighborhoods
CREATE POLICY "Creators can manage exchange neighborhoods"
  ON exchange_neighborhoods
  FOR ALL
  USING (
    listing_id IN (
      SELECT id FROM exchange_listings WHERE created_by = auth.uid()
    )
  );

-- ==============================================
-- EXCHANGE TRANSACTIONS POLICIES
-- ==============================================

-- Borrowers can view their own transactions
CREATE POLICY "Borrowers can view their transactions"
  ON exchange_transactions
  FOR SELECT
  USING (borrower_id = auth.uid());

-- Lenders can view transactions for their listings
CREATE POLICY "Lenders can view their transactions"
  ON exchange_transactions
  FOR SELECT
  USING (lender_id = auth.uid());

-- Borrowers can create transactions (requests)
CREATE POLICY "Borrowers can create transactions"
  ON exchange_transactions
  FOR INSERT
  WITH CHECK (
    borrower_id = auth.uid()
    AND tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Borrowers can update their own transactions
CREATE POLICY "Borrowers can update their transactions"
  ON exchange_transactions
  FOR UPDATE
  USING (borrower_id = auth.uid());

-- Lenders can update transactions for their listings
CREATE POLICY "Lenders can update their transactions"
  ON exchange_transactions
  FOR UPDATE
  USING (lender_id = auth.uid());

-- ==============================================
-- EXCHANGE FLAGS POLICIES
-- ==============================================

-- Users can view flag count (via RPC functions)
CREATE POLICY "Users can view exchange flags for their listings"
  ON exchange_flags
  FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM exchange_listings WHERE created_by = auth.uid()
    )
  );

-- Tenant admins can view all flags
CREATE POLICY "Tenant admins can view all exchange flags"
  ON exchange_flags
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'tenant_admin'
    )
  );

-- Verified residents can flag listings
CREATE POLICY "Residents can flag exchange listings"
  ON exchange_flags
  FOR INSERT
  WITH CHECK (
    flagged_by = auth.uid()
    AND tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM residents 
      WHERE auth_user_id = auth.uid() 
      AND onboarding_completed = true
    )
  );

-- Admins can remove flags
CREATE POLICY "Admins can remove exchange flags"
  ON exchange_flags
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'tenant_admin'
    )
  );
