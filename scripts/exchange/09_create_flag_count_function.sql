-- Create RPC function to get accurate flag count for exchange listings
-- This bypasses connection pooling cache issues

CREATE OR REPLACE FUNCTION get_exchange_listing_flag_count(p_listing_id UUID, p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE sql
VOLATILE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM exchange_flags
  WHERE listing_id = p_listing_id
    AND tenant_id = p_tenant_id;
$$;

-- Create RPC function to check if user has flagged a listing
CREATE OR REPLACE FUNCTION has_user_flagged_exchange_listing(p_listing_id UUID, p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
VOLATILE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM exchange_flags
    WHERE listing_id = p_listing_id
      AND flagged_by = p_user_id
      AND tenant_id = p_tenant_id
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_exchange_listing_flag_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_user_flagged_exchange_listing(UUID, UUID, UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_exchange_listing_flag_count IS 'Get accurate flag count for an exchange listing (bypasses pooler cache)';
COMMENT ON FUNCTION has_user_flagged_exchange_listing IS 'Check if a user has flagged an exchange listing';
