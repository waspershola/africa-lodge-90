-- Fix user invitation status tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT 'invited';
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add foreign key constraint
ALTER TABLE users ADD CONSTRAINT fk_users_invited_by 
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

-- Update existing users to have proper status
UPDATE users SET invitation_status = CASE 
  WHEN force_reset = true AND temp_expires IS NOT NULL THEN 'pending'
  WHEN force_reset = false AND last_login IS NOT NULL THEN 'active'
  ELSE 'active'
END WHERE invitation_status IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_invitation_status ON users(invitation_status);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);