-- Create lots table
CREATE TABLE IF NOT EXISTS public.lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(neighborhood_id, lot_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lots_neighborhood_id ON public.lots(neighborhood_id);

-- Enable RLS
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can do everything
CREATE POLICY "Super admins have full access to lots"
  ON public.lots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy: Tenant admins can manage lots in their tenant's neighborhoods
CREATE POLICY "Tenant admins can manage their tenant's lots"
  ON public.lots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.neighborhoods n
      JOIN public.users u ON u.tenant_id = n.tenant_id
      WHERE n.id = lots.neighborhood_id
      AND u.id = auth.uid()
      AND u.role = 'tenant_admin'
    )
  );

-- Policy: Residents can view lots in their tenant
CREATE POLICY "Residents can view lots in their tenant"
  ON public.lots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.neighborhoods n
      JOIN public.users u ON u.tenant_id = n.tenant_id
      WHERE n.id = lots.neighborhood_id
      AND u.id = auth.uid()
      AND u.role = 'resident'
    )
  );
