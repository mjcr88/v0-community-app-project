-- Allow residents to update their own family unit's profile picture and description
CREATE POLICY "Residents can update their own family unit"
ON public.family_units
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT family_unit_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT family_unit_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);
