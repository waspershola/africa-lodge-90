-- Re-enable RLS on tenants table and fix the issues
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Update the send-temp-password function to only send to verified domain owner
-- This is a no-op here since we'll update the edge function separately