-- Add RLS policy allowing residents to insert pets for their own family unit
CREATE POLICY "Residents can manage pets in their family unit"
  ON public.pets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'resident'
      AND users.family_unit_id = pets.family_unit_id
    )
  );
