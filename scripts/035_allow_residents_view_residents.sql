-- Allow residents to view other residents based on tenant visibility scope
-- This enables the neighbors directory and family features

-- Create policy for residents to view other residents
CREATE POLICY "residents_can_view_residents_in_scope"
  ON public.users
  FOR SELECT
  USING (
    -- Allow if user is viewing themselves
    auth.uid() = id
    OR
    -- Allow if user is super admin
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
    OR
    -- Allow if user is tenant admin viewing users in their tenant
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
        AND u.role = 'tenant_admin'
        AND u.tenant_id = users.tenant_id
    )
    OR
    -- Allow if user is resident viewing other residents based on tenant scope
    EXISTS (
      SELECT 1 FROM public.users current_user
      INNER JOIN public.tenants t ON t.id = current_user.tenant_id
      WHERE current_user.id = auth.uid()
        AND current_user.role = 'resident'
        AND users.role = 'resident'
        AND current_user.tenant_id = users.tenant_id
        AND (
          -- If scope is 'tenant', allow viewing all residents in tenant
          t.resident_visibility_scope = 'tenant'
          OR
          -- If scope is 'neighborhood', only allow viewing residents in same neighborhood
          (
            t.resident_visibility_scope = 'neighborhood'
            AND EXISTS (
              SELECT 1 FROM public.users u1
              INNER JOIN public.lots l1 ON l1.id = u1.lot_id
              INNER JOIN public.users u2 ON u2.id = users.id
              INNER JOIN public.lots l2 ON l2.id = u2.lot_id
              WHERE u1.id = current_user.id
                AND l1.neighborhood_id = l2.neighborhood_id
            )
          )
        )
    )
  );

-- Add comment
COMMENT ON POLICY "residents_can_view_residents_in_scope" ON public.users IS 'Allows residents to view other residents based on tenant visibility scope setting';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Created RLS policy for residents to view other residents';
END $$;
