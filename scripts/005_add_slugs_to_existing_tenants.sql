-- Add slugs to any existing tenants that don't have them
-- This generates URL-friendly slugs from tenant names

UPDATE public.tenants
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Ensure all slugs are unique by appending numbers if needed
DO $$
DECLARE
  tenant_record RECORD;
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  FOR tenant_record IN 
    SELECT id, name, slug 
    FROM public.tenants 
    ORDER BY created_at
  LOOP
    base_slug := lower(regexp_replace(tenant_record.name, '[^a-zA-Z0-9]+', '-', 'g'));
    new_slug := base_slug;
    counter := 1;
    
    -- Check if slug exists for a different tenant
    WHILE EXISTS (
      SELECT 1 FROM public.tenants 
      WHERE slug = new_slug AND id != tenant_record.id
    ) LOOP
      new_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update if slug changed
    IF tenant_record.slug != new_slug THEN
      UPDATE public.tenants SET slug = new_slug WHERE id = tenant_record.id;
    END IF;
  END LOOP;
END $$;
