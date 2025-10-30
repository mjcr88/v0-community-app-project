-- Extend residents table with onboarding and profile fields
ALTER TABLE residents
ADD COLUMN IF NOT EXISTS journey_stage TEXT CHECK (journey_stage IN ('planning', 'building', 'arriving', 'integrating')),
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS birth_country TEXT,
ADD COLUMN IF NOT EXISTS current_country TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[],
ADD COLUMN IF NOT EXISTS preferred_language TEXT,
ADD COLUMN IF NOT EXISTS estimated_move_in_date DATE,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add index for invite tokens
CREATE INDEX IF NOT EXISTS idx_residents_invite_token ON residents(invite_token);
