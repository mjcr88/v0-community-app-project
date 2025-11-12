-- Disable RLS on events table and remove problematic policies
-- This is Option A: Move visibility filtering to application layer

-- Drop the problematic RLS policy causing infinite recursion
DROP POLICY IF EXISTS "residents_can_view_events" ON events;

-- Keep other policies intact (insert, update, delete are fine)
-- These policies don't cause recursion because they don't read from events table

-- Update all existing NULL visibility events to 'community' for backwards compatibility
UPDATE events 
SET visibility_scope = 'community' 
WHERE visibility_scope IS NULL;

-- Add a default value for future events
ALTER TABLE events ALTER COLUMN visibility_scope SET DEFAULT 'community';
