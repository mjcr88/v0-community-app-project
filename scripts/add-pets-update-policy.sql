-- Allow residents to update pets in their family unit
CREATE POLICY "Residents can update pets in their family unit"
ON public.pets
FOR UPDATE
TO authenticated
USING (
  family_unit_id IN (
    SELECT family_unit_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  family_unit_id IN (
    SELECT family_unit_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);
