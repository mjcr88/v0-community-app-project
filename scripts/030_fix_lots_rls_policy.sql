-- Fix the lots RLS policy to work correctly with the existing schema
-- The current policy joins through neighborhoods, which is correct

-- Drop the existing policy that might be causing issues
DROP POLICY IF EXISTS "Residents can view lots in their tenant" ON public.lots;

-- Recreate the policy with explicit JOIN logic
CREATE POLICY "Residents can view lots in their tenant"
  ON public.lots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.neighborhoods n
      JOIN public.users u ON u.tenant_id = n.tenant_id
      WHERE n.id = lots.neighborhood_id
      AND u.id = auth.uid()
      AND u.role = 'resident'
    )
  );
