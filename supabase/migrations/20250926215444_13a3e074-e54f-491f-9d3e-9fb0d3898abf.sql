-- Update existing global users who should have force_reset enabled but don't
-- This fixes users created with the previous broken logic

UPDATE public.users 
SET 
  force_reset = true,
  temp_expires = now() + interval '24 hours',
  updated_at = now()
WHERE 
  tenant_id IS NULL  -- Global users
  AND is_active = true 
  AND force_reset = false 
  AND temp_password_hash IS NOT NULL
  AND temp_password_hash != ''
  AND (temp_expires IS NULL OR temp_expires < now()); -- Only update if temp password is expired or null

-- Log the update for audit purposes
INSERT INTO public.audit_log (
  action,
  resource_type,
  description,
  actor_id,
  metadata,
  created_at
) VALUES (
  'BULK_UPDATE_FORCE_RESET',
  'USER',
  'Fixed force_reset flag for existing global users with temporary passwords',
  NULL, -- System action
  jsonb_build_object(
    'reason', 'Fixed broken force_reset logic',
    'affected_users', (
      SELECT count(*) 
      FROM public.users 
      WHERE tenant_id IS NULL 
        AND is_active = true 
        AND force_reset = true 
        AND temp_password_hash IS NOT NULL
    )
  ),
  now()
);