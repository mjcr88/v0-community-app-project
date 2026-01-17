-- Fix RLS policy to allow residents to view their own family members
-- This is critical for neighbor_lists and general visibility

-- Update the can_view_resident function to include family check
CREATE OR REPLACE FUNCTION public.can_view_resident(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth, pg_catalog
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
  viewer_family_id UUID;
  target_family_id UUID;
  tenant_scope TEXT;
BEGIN
  -- Get viewer's role, tenant, and family
  SELECT role, tenant_id, family_unit_id INTO viewer_role, viewer_tenant_id, viewer_family_id
  FROM public.users WHERE id = auth.uid();
  
  -- If viewer is super admin or tenant admin, allow
  IF viewer_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Get target user's info
  SELECT role, tenant_id, lot_id, family_unit_id INTO target_role, target_tenant_id, target_lot_id, target_family_id
  FROM public.users WHERE id = target_user_id;
  
  -- If viewer is tenant admin in same tenant, allow
  IF viewer_role = 'tenant_admin' AND viewer_tenant_id = target_tenant_id THEN
    RETURN TRUE;
  END IF;
  
  -- If viewing self, allow
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;

  -- 1. Family Check: Always allow viewing members of the same family
  -- IMPORTANT: Must verify tenant match to prevent cross-tenant leakage
  IF viewer_family_id IS NOT NULL 
     AND viewer_family_id = target_family_id 
     AND viewer_tenant_id = target_tenant_id THEN
    RETURN TRUE;
  END IF;
  
  -- If viewer is resident
  IF viewer_role = 'resident' AND target_role = 'resident' AND viewer_tenant_id = target_tenant_id THEN
    -- Get tenant's visibility scope
    SELECT resident_visibility_scope INTO tenant_scope
    FROM public.tenants WHERE id = viewer_tenant_id;
    
    -- If scope is 'tenant', allow viewing all residents in tenant
    IF tenant_scope = 'tenant' THEN
      RETURN TRUE;
    END IF;
    
    -- If scope is 'neighborhood', check if same neighborhood
    IF tenant_scope = 'neighborhood' THEN
      -- Get viewer's neighborhood
      SELECT l.neighborhood_id INTO viewer_neighborhood_id
      FROM public.users u
      INNER JOIN public.lots l ON l.id = u.lot_id
      WHERE u.id = auth.uid();
      
      -- Get target's neighborhood
      SELECT l.neighborhood_id INTO target_neighborhood_id
      FROM public.lots l
      WHERE l.id = target_lot_id;
      
      -- Allow if same neighborhood
      IF viewer_neighborhood_id = target_neighborhood_id THEN
        RETURN TRUE;
      END IF;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Notify
DO $$
BEGIN
  RAISE NOTICE 'Updated can_view_resident to include family visibility check';
END $$;
