-- Add primary_contact_id to family_units table
ALTER TABLE family_units
ADD COLUMN primary_contact_id UUID REFERENCES residents(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_family_units_primary_contact ON family_units(primary_contact_id);
