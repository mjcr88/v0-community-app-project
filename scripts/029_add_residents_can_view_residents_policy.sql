-- Add RLS policy to allow residents to view other residents in their tenant
-- This enables family members to see each other
-- Also ensures super admins and tenant admins can still query users

CREATE POLICY "Residents can view other residents in their tenant"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'resident'  -- Residents can see other residents in their tenant
        OR u.role = 'tenant_admin'  -- Tenant admins can see users in their tenant
        OR u.role = 'super_admin'  -- Super admins can see all users
      )
      AND (
        u.role = 'super_admin'  -- Super admins see everyone
        OR u.tenant_id = users.tenant_id  -- Others see only their tenant
      )
    )
  );
