-- Add tenant_id column to lots table for simpler RLS policies
-- This eliminates the need to JOIN through neighborhoods in RLS policies

-- Step 1: Add tenant_id column (nullable initially)
ALTER TABLE public.lots
ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Step 2: Populate tenant_id for existing lots by joining through neighborhoods
UPDATE public.lots
SET tenant_id = n.tenant_id
FROM public.neighborhoods n
WHERE lots.neighborhood_id = n.id;

-- Step 3: Make tenant_id NOT NULL now that all rows have values
ALTER TABLE public.lots
ALTER COLUMN tenant_id SET NOT NULL;

-- Step 4: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lots_tenant_id ON public.lots(tenant_id);

-- Step 5: Drop the old complex RLS policy
DROP POLICY IF EXISTS "Residents can view lots in their tenant" ON public.lots;

-- Step 6: Create simpler RLS policy using tenant_id directly
CREATE POLICY "Residents can view lots in their tenant"
  ON public.lots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.tenant_id = lots.tenant_id
      AND users.role = 'resident'
    )
  );

-- Step 7: Update tenant admin policy to use tenant_id directly
DROP POLICY IF EXISTS "Tenant admins can manage their tenant's lots" ON public.lots;

CREATE POLICY "Tenant admins can manage their tenant's lots"
  ON public.lots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.tenant_id = lots.tenant_id
      AND users.role = 'tenant_admin'
    )
  );
