-- Create residents table
CREATE TABLE IF NOT EXISTS public.residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  move_in_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_residents_lot_id ON public.residents(lot_id);
CREATE INDEX IF NOT EXISTS idx_residents_status ON public.residents(status);

-- Enable RLS
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can do everything
CREATE POLICY "Super admins have full access to residents"
  ON public.residents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy: Tenant admins can manage residents in their tenant's lots
CREATE POLICY "Tenant admins can manage their tenant's residents"
  ON public.residents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lots l
      JOIN public.neighborhoods n ON n.id = l.neighborhood_id
      JOIN public.users u ON u.tenant_id = n.tenant_id
      WHERE l.id = residents.lot_id
      AND u.id = auth.uid()
      AND u.role = 'tenant_admin'
    )
  );

-- Policy: Residents can view residents in their tenant
CREATE POLICY "Residents can view residents in their tenant"
  ON public.residents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lots l
      JOIN public.neighborhoods n ON n.id = l.neighborhood_id
      JOIN public.users u ON u.tenant_id = n.tenant_id
      WHERE l.id = residents.lot_id
      AND u.id = auth.uid()
      AND u.role = 'resident'
    )
  );
