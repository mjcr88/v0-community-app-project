-- Add features column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{
  "neighborhoods": true,
  "interests": true,
  "skills": true,
  "pets": true,
  "families": true,
  "lots": true,
  "journey_stages": true,
  "onboarding": true
}'::jsonb;

-- Update existing tenants to have all features enabled
UPDATE tenants SET features = '{
  "neighborhoods": true,
  "interests": true,
  "skills": true,
  "pets": true,
  "families": true,
  "lots": true,
  "journey_stages": true,
  "onboarding": true
}'::jsonb WHERE features IS NULL;
