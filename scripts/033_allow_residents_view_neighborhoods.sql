-- Allow residents to view neighborhoods in their tenant
-- This enables the dashboard to display neighborhood information via the lots → neighborhoods JOIN

-- Add policy for residents to view neighborhoods in their tenant
CREATE POLICY "residents_view_neighborhoods_in_tenant" ON public.neighborhoods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'resident' 
        AND u.tenant_id = neighborhoods.tenant_id
    )
  );
