-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Residents can update their own family unit" ON public.family_units;

-- Allow residents to update their own family unit's profile picture and description
-- This policy checks if the current user belongs to the family_unit being updated
CREATE POLICY "Residents can update their own family unit"
ON public.family_units
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT family_unit_id 
    FROM public.users 
    WHERE id = auth.uid()
    AND family_unit_id IS NOT NULL
  )
)
WITH CHECK (
  id IN (
    SELECT family_unit_id 
    FROM public.users 
    WHERE id = auth.uid()
    AND family_unit_id IS NOT NULL
  )
);
