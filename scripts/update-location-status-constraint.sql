-- Update the status check constraint to support more status options
-- This replaces the old constraint with an expanded list

-- Drop the old constraint
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_status_check;

-- Add new constraint with expanded options
ALTER TABLE locations 
ADD CONSTRAINT locations_status_check 
CHECK (status IN ('Open', 'Closed', 'Maintenance', 'Coming Soon', 'Temporarily Unavailable'));

-- Update any existing 'Temporarily Closed' values to 'Temporarily Unavailable'
UPDATE locations SET status = 'Temporarily Unavailable' WHERE status = 'Temporarily Closed';
