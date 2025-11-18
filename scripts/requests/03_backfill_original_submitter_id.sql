-- Backfill original_submitter_id for existing requests
-- This fixes the issue where old requests don't show up because original_submitter_id is NULL

UPDATE resident_requests
SET original_submitter_id = created_by
WHERE original_submitter_id IS NULL 
  AND created_by IS NOT NULL;

-- For anonymous requests created before the column existed, we can't recover the submitter
-- These will remain hidden from the original submitter unless they know the request ID
