-- Create document_reads table
CREATE TABLE IF NOT EXISTS document_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, user_id)
);

-- RLS Policies
ALTER TABLE document_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own read status"
  ON document_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own read status"
  ON document_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own read status"
  ON document_reads FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all (for potential analytics)
CREATE POLICY "Admins can view all document reads"
  ON document_reads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('tenant_admin', 'admin', 'super_admin') AND users.tenant_id = document_reads.tenant_id
    )
  );
