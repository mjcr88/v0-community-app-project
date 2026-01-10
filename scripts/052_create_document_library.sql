-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Content
  title TEXT NOT NULL,
  description TEXT, -- Short summary
  content TEXT, -- Rich text for document pages
  cover_image_url TEXT, -- Optional hero image
  file_url TEXT, -- PDF URL if uploaded
  document_type TEXT CHECK (document_type IN ('page', 'pdf')),
  
  -- Organization
  category TEXT CHECK (category IN ('regulation', 'financial', 'construction', 'hoa')),
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Residents can view published documents"
  ON documents FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND status = 'published'
  );

CREATE POLICY "Admins can manage documents"
  ON documents FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    )
  );


-- Create document_changelog table
CREATE TABLE IF NOT EXISTS document_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  change_summary TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for changelog
ALTER TABLE document_changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Residents can view changelogs"
  ON document_changelog FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_changelog.document_id
      AND d.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
      AND d.status = 'published'
    )
  );

CREATE POLICY "Admins can manage changelogs"
  ON document_changelog FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
