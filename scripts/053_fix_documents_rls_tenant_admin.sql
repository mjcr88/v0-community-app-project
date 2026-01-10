-- Fix RLS policies to allow tenant_admin to manage documents
-- Reason: Previous policy only checked for 'admin' and 'super_admin', but the application uses 'tenant_admin'.

DROP POLICY IF EXISTS "Admins can manage documents" ON documents;

CREATE POLICY "Admins can manage documents"
  ON documents FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('tenant_admin', 'admin', 'super_admin'))
    )
  );

DROP POLICY IF EXISTS "Admins can manage changelogs" ON document_changelog;

CREATE POLICY "Admins can manage changelogs"
  ON document_changelog FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('tenant_admin', 'admin', 'super_admin')
    )
  );
