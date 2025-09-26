-- Fix user deletion issue by modifying foreign key constraint
-- This allows users to be deleted while preserving audit history

-- Drop existing constraint that prevents user deletion
ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS audit_log_actor_id_fkey;

-- Add new constraint with ON DELETE SET NULL to preserve audit history
-- When a user is deleted, their actor_id in audit logs becomes null but all other audit data remains
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_actor_id_fkey 
  FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;