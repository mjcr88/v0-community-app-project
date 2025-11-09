-- Add family_unit_id to residents table
ALTER TABLE public.residents
ADD COLUMN IF NOT EXISTS family_unit_id UUID REFERENCES public.family_units(id) ON DELETE SET NULL;

-- Remove move_in_date and status columns
ALTER TABLE public.residents
DROP COLUMN IF EXISTS move_in_date,
DROP COLUMN IF EXISTS status;

-- Create index for family_unit_id
CREATE INDEX IF NOT EXISTS idx_residents_family_unit_id ON public.residents(family_unit_id);

-- Drop the old status index if it exists
DROP INDEX IF EXISTS idx_residents_status;
