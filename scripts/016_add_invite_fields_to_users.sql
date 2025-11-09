-- Add invite fields to users table for tenant admin invites
ALTER TABLE users
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE;

-- Add index for invite tokens
CREATE INDEX IF NOT EXISTS idx_users_invite_token ON users(invite_token);
