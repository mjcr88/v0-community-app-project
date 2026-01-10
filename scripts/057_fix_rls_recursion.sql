-- Fix infinite recursion in RLS policies by using SECURITY DEFINER functions
-- instead of querying the users table directly in policies.

-- 1. Update lots policy
DROP POLICY IF EXISTS "Residents can view lots in their tenant" ON lots;
CREATE POLICY "Residents can view lots in their tenant" ON lots
  FOR SELECT
  TO public
  USING (
    (get_user_role() = 'resident') AND 
    (get_user_tenant_id() = tenant_id)
  );

-- 2. Update neighborhoods policy
DROP POLICY IF EXISTS "residents_view_neighborhoods_in_tenant" ON neighborhoods;
CREATE POLICY "residents_view_neighborhoods_in_tenant" ON neighborhoods
  FOR SELECT
  TO public
  USING (
    (get_user_role() = 'resident') AND 
    (get_user_tenant_id() = tenant_id)
  );

-- 3. Update family_units policy
DROP POLICY IF EXISTS "Residents can view family_units in their tenant" ON family_units;
CREATE POLICY "Residents can view family_units in their tenant" ON family_units
  FOR SELECT
  TO public
  USING (
    (get_user_role() = 'resident') AND 
    (get_user_tenant_id() = tenant_id)
  );
