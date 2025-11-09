-- Create family_relationships table to store relationship types between family members
CREATE TABLE IF NOT EXISTS public.family_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  related_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_relationship UNIQUE(user_id, related_user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_family_relationships_user_id ON public.family_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_related_user_id ON public.family_relationships(related_user_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_tenant_id ON public.family_relationships(tenant_id);

-- Enable RLS
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins have full access to family_relationships"
ON public.family_relationships
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Tenant admins can manage their tenant's family_relationships"
ON public.family_relationships
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_tenant_admin = true
    AND users.tenant_id = family_relationships.tenant_id
  )
);

CREATE POLICY "Users can manage their own family_relationships"
ON public.family_relationships
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can view family_relationships in their tenant"
ON public.family_relationships
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.tenant_id = family_relationships.tenant_id
  )
);
