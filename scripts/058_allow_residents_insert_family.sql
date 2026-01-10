-- Migration 058: Allow residents to insert family members
-- Residents who are primary contacts can add members to their own family unit.

BEGIN;

-- Drop existing restricted policy if it exists (for idempotency)
DROP POLICY IF EXISTS "residents_insert_family_members" ON "public"."users";

CREATE POLICY "residents_insert_family_members" ON "public"."users"
FOR INSERT
TO "authenticated"
WITH CHECK (
  -- 1. Must be inserting into the same family unit as the creator
  -- AND the creator must be the primary contact for that family unit
  EXISTS (
    SELECT 1 FROM family_units
    WHERE id = users.family_unit_id
    AND primary_contact_id = auth.uid()
  )
  AND
  -- 2. Must be role 'resident'
  users.role = 'resident'
  AND
  -- 3. Tenant ID must match the creator's tenant ID
  users.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

COMMIT;
