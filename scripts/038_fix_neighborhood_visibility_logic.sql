-- Fix the can_view_resident function to properly handle neighborhood visibility
CREATE OR REPLACE FUNCTION public.can_view_resident(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  viewer_role TEXT;
  viewer_tenant_id UUID;
  target_role TEXT;
  target_tenant_id UUID;
  target_lot_id UUID;
  target_neighborhood_id UUID;
  viewer_lot_id UUID;
  viewer_neighborhood_id UUID;
  tenant_scope TEXT;
BEGIN
  -- Get viewer's role, tenant, and lot
  SELECT role, tenant_id, lot_id INTO viewer_role, viewer_tenant_id, viewer_lot_id
  FROM public.users WHERE id = auth.uid();
  
  -- If viewer is super admin, allow
  IF viewer_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Get target user's info
  SELECT role, tenant_id, lot_id INTO target_role, target_tenant_id, target_lot_id
  FROM public.users WHERE id = target_user_id;
  
  -- If viewer is tenant admin in same tenant, allow
  IF viewer_role = 'tenant_admin' AND viewer_tenant_id = target_tenant_id THEN
    RETURN TRUE;
  END IF;
  
  -- If viewing self, allow
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- If viewer is resident
  IF viewer_role = 'resident' AND target_role = 'resident' AND viewer_tenant_id = target_tenant_id THEN
    -- Get tenant's visibility scope
    SELECT resident_visibility_scope INTO tenant_scope
    FROM public.tenants WHERE id = viewer_tenant_id;
    
    -- If scope is 'tenant' or NULL (default), allow viewing all residents in tenant
    IF tenant_scope = 'tenant' OR tenant_scope IS NULL THEN
      RETURN TRUE;
    END IF;
    
    -- If scope is 'neighborhood', check if same neighborhood
    IF tenant_scope = 'neighborhood' THEN
      -- Get neighborhoods directly from lots table using lot_id
      IF viewer_lot_id IS NOT NULL AND target_lot_id IS NOT NULL THEN
        SELECT neighborhood_id INTO viewer_neighborhood_id
        FROM public.lots WHERE id = viewer_lot_id;
        
        SELECT neighborhood_id INTO target_neighborhood_id
        FROM public.lots WHERE id = target_lot_id;
        
        -- Allow if same neighborhood (both must have neighborhoods)
        IF viewer_neighborhood_id IS NOT NULL 
           AND target_neighborhood_id IS NOT NULL 
           AND viewer_neighborhood_id = target_neighborhood_id THEN
          RETURN TRUE;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.can_view_resident(UUID) IS 'Fixed to properly handle neighborhood-based visibility by checking lot neighborhoods directly';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed neighborhood visibility logic in can_view_resident function';
END $$;
