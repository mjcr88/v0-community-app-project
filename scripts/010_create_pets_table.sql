-- Create pets table
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_unit_id UUID REFERENCES public.family_units(id) ON DELETE SET NULL,
  lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pets_family_unit_id ON public.pets(family_unit_id);
CREATE INDEX IF NOT EXISTS idx_pets_lot_id ON public.pets(lot_id);

-- Enable RLS
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can do everything
CREATE POLICY "Super admins have full access to pets"
  ON public.pets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy: Tenant admins can manage pets in their tenant's lots
CREATE POLICY "Tenant admins can manage their tenant's pets"
  ON public.pets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lots l
      JOIN public.neighborhoods n ON n.id = l.neighborhood_id
      JOIN public.users u ON u.tenant_id = n.tenant_id
      WHERE l.id = pets.lot_id
      AND u.id = auth.uid()
      AND u.role = 'tenant_admin'
    )
  );

-- Policy: Residents can view pets in their tenant
CREATE POLICY "Residents can view pets in their tenant"
  ON public.pets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lots l
      JOIN public.neighborhoods n ON n.id = l.neighborhood_id
      JOIN public.users u ON u.tenant_id = n.tenant_id
      WHERE l.id = pets.lot_id
      AND u.id = auth.uid()
      AND u.role = 'resident'
    )
  );
