-- Add RLS policy to allow residents to see public maintenance and safety requests from all residents

-- Create policy for viewing community requests (maintenance and safety, non-anonymous only)
CREATE POLICY residents_view_community_requests ON resident_requests
  FOR SELECT 
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND request_type IN ('maintenance', 'safety')
    AND is_anonymous = false
  );

-- Note: This policy works alongside the existing residents_view_own_requests policy
-- Residents will now see:
-- 1. All their own requests (including anonymous ones) via residents_view_own_requests
-- 2. All public maintenance and safety requests from other residents via this policy
