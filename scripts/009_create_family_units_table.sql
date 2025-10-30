-- Create family_units table
CREATE TABLE IF NOT EXISTS public.family_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_family_units_tenant_id ON public.family_units(tenant_id);

-- Enable RLS
ALTER TABLE public.family_units ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can do everything
CREATE POLICY "Super admins have full access to family_units"
  ON public.family_units
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy: Tenant admins can manage family units in their tenant
CREATE POLICY "Tenant admins can manage their tenant's family_units"
  ON public.family_units
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.tenant_id = family_units.tenant_id
      AND users.role = 'tenant_admin'
    )
  );

-- Policy: Residents can view family units in their tenant
CREATE POLICY "Residents can view family_units in their tenant"
  ON public.family_units
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.tenant_id = family_units.tenant_id
      AND users.role = 'resident'
    )
  );
