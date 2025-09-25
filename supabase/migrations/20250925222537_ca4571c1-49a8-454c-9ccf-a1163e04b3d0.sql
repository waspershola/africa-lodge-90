-- Clean up inconsistent user data
-- User tiu@gmail.com exists in auth but not in users table, so we'll remove from auth
-- First get the auth user ID for tiu@gmail.com (we can't delete directly from auth schema)

-- For now, let's just check if we have triggers that might be interfering
SELECT trigger_name, event_manipulation, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE event_object_schema = 'public' AND event_object_table = 'users';