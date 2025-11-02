-- Allow residents to view privacy settings of other residents
-- This is needed so the application can filter what information to display

-- Create policy for residents to view privacy settings of others in their scope
CREATE POLICY "residents_can_view_privacy_settings_in_scope"
  ON public.user_privacy_settings
  FOR SELECT
  USING (
    -- Allow if user is viewing their own settings
    auth.uid() = user_id
    OR
    -- Allow if user is super admin
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
    OR
    -- Allow if user is tenant admin viewing settings in their tenant
    EXISTS (
      -- Renamed current_user to viewer_user to avoid PostgreSQL reserved keyword
      SELECT 1 FROM public.users viewer_user
      INNER JOIN public.users target_user ON target_user.id = user_privacy_settings.user_id
      WHERE viewer_user.id = auth.uid()
        AND viewer_user.role = 'tenant_admin'
        AND viewer_user.tenant_id = target_user.tenant_id
    )
    OR
    -- Allow if user is resident viewing privacy settings of other residents in scope
    EXISTS (
      -- Renamed current_user to viewer_user to avoid PostgreSQL reserved keyword
      SELECT 1 FROM public.users viewer_user
      INNER JOIN public.tenants t ON t.id = viewer_user.tenant_id
      INNER JOIN public.users target_user ON target_user.id = user_privacy_settings.user_id
      WHERE viewer_user.id = auth.uid()
        AND viewer_user.role = 'resident'
        AND target_user.role = 'resident'
        AND viewer_user.tenant_id = target_user.tenant_id
        AND (
          -- If scope is 'tenant', allow viewing all privacy settings in tenant
          t.resident_visibility_scope = 'tenant'
          OR
          -- If scope is 'neighborhood', only allow viewing settings of residents in same neighborhood
          (
            t.resident_visibility_scope = 'neighborhood'
            AND EXISTS (
              SELECT 1 FROM public.users u1
              INNER JOIN public.lots l1 ON l1.id = u1.lot_id
              INNER JOIN public.users u2 ON u2.id = target_user.id
              INNER JOIN public.lots l2 ON l2.id = u2.lot_id
              WHERE u1.id = viewer_user.id
                AND l1.neighborhood_id = l2.neighborhood_id
            )
          )
        )
    )
  );

-- Add comment
COMMENT ON POLICY "residents_can_view_privacy_settings_in_scope" ON public.user_privacy_settings IS 'Allows residents to view privacy settings of other residents to respect their privacy preferences';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Created RLS policy for residents to view privacy settings';
END $$;
