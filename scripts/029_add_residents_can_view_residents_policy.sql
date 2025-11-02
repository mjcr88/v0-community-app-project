-- Add RLS policy to allow residents to view other residents in their tenant
-- This enables family members to see each other

CREATE POLICY "Residents can view other residents in their tenant"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'resident'
      AND u.tenant_id = users.tenant_id
    )
  );
