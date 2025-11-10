-- Fix RLS policies to check 'role' column instead of 'is_tenant_admin'
-- This script drops and recreates the policies with the correct admin check

-- Drop existing policies
DROP POLICY IF EXISTS "Residents can view tenant event categories" ON event_categories;
DROP POLICY IF EXISTS "Tenant admins can insert event categories" ON event_categories;
DROP POLICY IF EXISTS "Tenant admins can update event categories" ON event_categories;
DROP POLICY IF EXISTS "Tenant admins can delete event categories" ON event_categories;

-- Recreate policies with role check
CREATE POLICY "Residents can view tenant event categories"
  ON event_categories FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can insert event categories"
  ON event_categories FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'tenant_admin'
    )
  );

CREATE POLICY "Tenant admins can update event categories"
  ON event_categories FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'tenant_admin'
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'tenant_admin'
    )
  );

CREATE POLICY "Tenant admins can delete event categories"
  ON event_categories FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'tenant_admin'
    )
  );
