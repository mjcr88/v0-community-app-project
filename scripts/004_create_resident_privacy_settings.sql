-- Create table for resident privacy settings
-- This allows residents to control what information is visible on their public profile
-- All fields default to true (public) except name and lot which are always public

CREATE TABLE IF NOT EXISTS resident_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  
  -- Contact Information Privacy
  show_email BOOLEAN DEFAULT true,
  show_phone BOOLEAN DEFAULT true,
  
  -- Personal Information Privacy
  show_birthday BOOLEAN DEFAULT true,
  show_birth_country BOOLEAN DEFAULT true,
  show_current_country BOOLEAN DEFAULT true,
  show_languages BOOLEAN DEFAULT true,
  show_preferred_language BOOLEAN DEFAULT true,
  
  -- Journey Information Privacy
  show_journey_stage BOOLEAN DEFAULT true,
  show_estimated_move_in_date BOOLEAN DEFAULT true,
  
  -- Profile Picture Privacy
  show_profile_picture BOOLEAN DEFAULT true,
  
  -- Community Information Privacy
  show_neighborhood BOOLEAN DEFAULT true,
  show_family BOOLEAN DEFAULT true,
  show_interests BOOLEAN DEFAULT true,
  show_skills BOOLEAN DEFAULT true,
  show_open_to_requests BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one privacy setting per resident
  UNIQUE(resident_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_resident_privacy_settings_resident_id ON resident_privacy_settings(resident_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_resident_privacy_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resident_privacy_settings_updated_at
  BEFORE UPDATE ON resident_privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_resident_privacy_settings_updated_at();

-- Create default privacy settings for existing residents
INSERT INTO resident_privacy_settings (resident_id)
SELECT id FROM residents
WHERE id NOT IN (SELECT resident_id FROM resident_privacy_settings);

-- Add comment to table
COMMENT ON TABLE resident_privacy_settings IS 'Controls what information is visible on a resident''s public profile. Name and lot assignment are always public.';
