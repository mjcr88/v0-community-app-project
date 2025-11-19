-- Add columns for tracking tagged residents and pets in requests (especially for complaints)
ALTER TABLE resident_requests 
ADD COLUMN IF NOT EXISTS tagged_resident_ids UUID[],
ADD COLUMN IF NOT EXISTS tagged_pet_ids UUID[];

-- Add column to track original submitter for anonymous requests
ALTER TABLE resident_requests 
ADD COLUMN IF NOT EXISTS original_submitter_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resident_requests_tagged_resident_ids ON resident_requests USING GIN(tagged_resident_ids);
CREATE INDEX IF NOT EXISTS idx_resident_requests_tagged_pet_ids ON resident_requests USING GIN(tagged_pet_ids);
CREATE INDEX IF NOT EXISTS idx_resident_requests_original_submitter_id ON resident_requests(original_submitter_id);

-- Add comments
COMMENT ON COLUMN resident_requests.tagged_resident_ids IS 'Array of user IDs tagged in the request (for complaints about residents)';
COMMENT ON COLUMN resident_requests.tagged_pet_ids IS 'Array of pet IDs tagged in the request (for complaints about pets)';
COMMENT ON COLUMN resident_requests.original_submitter_id IS 'Always stores the actual submitter, even for anonymous requests (visible to admins only)';

-- Update RLS Policies to handle anonymous requests properly

-- Drop old residents view policy
DROP POLICY IF EXISTS residents_view_own_requests ON resident_requests;

-- New policy allows residents to see their own requests, including anonymous ones through original_submitter_id
CREATE POLICY residents_view_own_requests ON resident_requests
  FOR SELECT 
  USING (
    (created_by = auth.uid() OR original_submitter_id = auth.uid())
    AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Update residents update policy to use original_submitter_id for anonymous requests
DROP POLICY IF EXISTS residents_update_own_pending ON resident_requests;

CREATE POLICY residents_update_own_pending ON resident_requests
  FOR UPDATE 
  USING (
    (created_by = auth.uid() OR original_submitter_id = auth.uid())
    AND status = 'pending'
  );
