-- Migration: Add tenant_id to event_flags table
-- This improves query performance and data integrity by adding direct tenant scoping

-- Step 1: Add tenant_id column (nullable initially)
ALTER TABLE event_flags 
ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Step 2: Backfill tenant_id from the events table
UPDATE event_flags ef
SET tenant_id = e.tenant_id
FROM events e
WHERE ef.event_id = e.id;

-- Step 3: Make tenant_id NOT NULL now that all rows have values
ALTER TABLE event_flags 
ALTER COLUMN tenant_id SET NOT NULL;

-- Step 4: Add index for performance (tenant-scoped queries will be faster)
CREATE INDEX idx_event_flags_tenant_id ON event_flags(tenant_id);

-- Step 5: Add index for common query pattern (tenant + event lookup)
CREATE INDEX idx_event_flags_tenant_event ON event_flags(tenant_id, event_id);

-- Verify the migration
DO $$
DECLARE
  flag_count INTEGER;
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO flag_count FROM event_flags;
  SELECT COUNT(*) INTO null_count FROM event_flags WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Migration complete: % total flags, % with null tenant_id', flag_count, null_count;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % flags still have null tenant_id', null_count;
  END IF;
END $$;
