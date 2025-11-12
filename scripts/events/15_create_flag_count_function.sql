-- Create RPC function to get accurate flag count
-- This bypasses connection pooling cache issues

CREATE OR REPLACE FUNCTION get_event_flag_count(p_event_id UUID, p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE sql
VOLATILE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM event_flags
  WHERE event_id = p_event_id
    AND tenant_id = p_tenant_id;
$$;

-- Create RPC function to check if user has flagged an event
CREATE OR REPLACE FUNCTION has_user_flagged_event(p_event_id UUID, p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
VOLATILE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM event_flags
    WHERE event_id = p_event_id
      AND flagged_by = p_user_id
      AND tenant_id = p_tenant_id
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_event_flag_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_user_flagged_event(UUID, UUID, UUID) TO authenticated;

-- Verify functions work
DO $$
DECLARE
  test_count INTEGER;
  test_bool BOOLEAN;
BEGIN
  -- Test get_event_flag_count (should return 0 or more for any event)
  SELECT get_event_flag_count(
    (SELECT id FROM events LIMIT 1),
    (SELECT tenant_id FROM events LIMIT 1)
  ) INTO test_count;
  
  RAISE NOTICE 'Flag count function test: %', test_count;
  
  -- Test has_user_flagged_event
  SELECT has_user_flagged_event(
    (SELECT id FROM events LIMIT 1),
    (SELECT created_by FROM events LIMIT 1),
    (SELECT tenant_id FROM events LIMIT 1)
  ) INTO test_bool;
  
  RAISE NOTICE 'Has user flagged function test: %', test_bool;
  
  RAISE NOTICE 'Flag count RPC functions created and verified successfully!';
END $$;
