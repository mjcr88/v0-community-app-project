-- Migration to update family_units.primary_contact_id to reference users(id) instead of residents(id)

-- 1. Update existing data to point to the migrated user_id
UPDATE family_units fu
SET primary_contact_id = r.migrated_to_user_id
FROM residents r
WHERE fu.primary_contact_id = r.id
  AND r.migrated_to_user_id IS NOT NULL;

-- 2. Drop existing foreign key constraint
ALTER TABLE family_units 
  DROP CONSTRAINT IF EXISTS family_units_primary_contact_id_fkey;

-- 3. Add new foreign key constraint referencing users
ALTER TABLE family_units 
  ADD CONSTRAINT family_units_primary_contact_id_fkey 
  FOREIGN KEY (primary_contact_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc 
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name 
    WHERE tc.table_name = 'family_units' 
      AND tc.constraint_name = 'family_units_primary_contact_id_fkey' 
      AND ccu.table_name = 'users'
  ) THEN
    RAISE NOTICE 'SUCCESS: family_units now references users table';
  ELSE
    RAISE EXCEPTION 'FAILURE: constraint update failed';
  END IF;
END $$;
