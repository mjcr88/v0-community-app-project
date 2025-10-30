-- Create neighborhoods table
CREATE TABLE IF NOT EXISTS public.neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for neighborhoods table
-- Super admins can do everything
CREATE POLICY "super_admins_all_neighborhoods" ON public.neighborhoods
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

-- Tenant admins can manage neighborhoods in their tenant
CREATE POLICY "tenant_admins_select_neighborhoods" ON public.neighborhoods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'tenant_admin' 
        AND u.tenant_id = neighborhoods.tenant_id
    )
  );

CREATE POLICY "tenant_admins_insert_neighborhoods" ON public.neighborhoods
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'tenant_admin' 
        AND u.tenant_id = neighborhoods.tenant_id
    )
  );

CREATE POLICY "tenant_admins_update_neighborhoods" ON public.neighborhoods
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'tenant_admin' 
        AND u.tenant_id = neighborhoods.tenant_id
    )
  );

CREATE POLICY "tenant_admins_delete_neighborhoods" ON public.neighborhoods
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'tenant_admin' 
        AND u.tenant_id = neighborhoods.tenant_id
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_neighborhoods_tenant_id ON public.neighborhoods(tenant_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for neighborhoods
DROP TRIGGER IF EXISTS update_neighborhoods_updated_at ON public.neighborhoods;
CREATE TRIGGER update_neighborhoods_updated_at
  BEFORE UPDATE ON public.neighborhoods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
